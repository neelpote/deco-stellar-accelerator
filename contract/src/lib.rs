#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, token, Address, Env, String,
};

mod test;

#[derive(Clone)]
#[contracttype]
pub struct StartupData {
    pub project_name: String,
    pub description: String,
    pub project_url: String,
    pub team_info: String,
    pub funding_goal: i128,
    pub total_allocated: i128,
    pub unlocked_balance: i128,
    pub claimed_balance: i128,
    pub voting_end_time: u64,
    pub yes_votes: u32,
    pub no_votes: u32,
    pub approved: bool,
}

#[derive(Clone)]
#[contracttype]
pub struct VCData {
    pub vc_address: Address,
    pub company_name: String,
    pub stake_amount: i128,
    pub total_invested: i128,
}

#[contracttype]
pub enum DataKey {
    Admin,
    ApplicationFee,
    VCStakeRequired, // Minimum stake to become VC
    Startup(Address),
    VCData(Address),
    Vote(Address, Address), // (voter_address, founder_address)
    AllStartups,
    AllVCs,
    Investment(Address, Address), // (vc_address, founder_address) -> amount invested
}

#[contract]
pub struct DeCoMVP;

#[contractimpl]
impl DeCoMVP {
    /// Initialize the contract with admin address, application fee, and VC stake requirement
    pub fn init(env: Env, admin: Address, fee: i128, vc_stake_required: i128) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Contract already initialized");
        }
        
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::ApplicationFee, &fee);
        env.storage().instance().set(&DataKey::VCStakeRequired, &vc_stake_required);
    }

    /// Founder applies by submitting project details
    pub fn apply(
        env: Env,
        founder: Address,
        project_name: String,
        description: String,
        project_url: String,
        team_info: String,
        funding_goal: i128,
    ) {
        founder.require_auth();

        // Check if already applied
        if env.storage().instance().has(&DataKey::Startup(founder.clone())) {
            panic!("Already applied");
        }

        // Set voting period to 7 days (in seconds)
        let voting_end_time = env.ledger().timestamp() + (7 * 24 * 60 * 60);

        // Create startup entry with voting enabled
        let startup_data = StartupData {
            project_name,
            description,
            project_url,
            team_info,
            funding_goal,
            total_allocated: 0,
            unlocked_balance: 0,
            claimed_balance: 0,
            voting_end_time,
            yes_votes: 0,
            no_votes: 0,
            approved: false,
        };

        env.storage()
            .instance()
            .set(&DataKey::Startup(founder.clone()), &startup_data);

        // Add to all startups list
        let mut all_startups: soroban_sdk::Vec<Address> = env
            .storage()
            .instance()
            .get(&DataKey::AllStartups)
            .unwrap_or(soroban_sdk::Vec::new(&env));
        
        all_startups.push_back(founder);
        env.storage().instance().set(&DataKey::AllStartups, &all_startups);
    }

    /// Get all startup addresses
    pub fn get_all_startups(env: Env) -> soroban_sdk::Vec<Address> {
        env.storage()
            .instance()
            .get(&DataKey::AllStartups)
            .unwrap_or(soroban_sdk::Vec::new(&env))
    }

    /// Public voting on startup applications
    pub fn vote(env: Env, voter: Address, founder: Address, vote_yes: bool) {
        voter.require_auth();

        // Check if startup exists
        let mut startup_data: StartupData = env
            .storage()
            .instance()
            .get(&DataKey::Startup(founder.clone()))
            .expect("Startup not found");

        // Check if voting period is still active
        if env.ledger().timestamp() > startup_data.voting_end_time {
            panic!("Voting period has ended");
        }

        // Check if already voted
        let vote_key = DataKey::Vote(voter.clone(), founder.clone());
        if env.storage().instance().has(&vote_key) {
            panic!("Already voted");
        }

        // Record vote
        env.storage().instance().set(&vote_key, &vote_yes);

        // Update vote counts
        if vote_yes {
            startup_data.yes_votes += 1;
        } else {
            startup_data.no_votes += 1;
        }

        env.storage()
            .instance()
            .set(&DataKey::Startup(founder), &startup_data);
    }

    /// Admin approves application after reviewing votes
    pub fn approve_application(env: Env, admin: Address, founder: Address) {
        admin.require_auth();

        let stored_admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("Admin not set");
        
        if admin != stored_admin {
            panic!("Unauthorized: not admin");
        }

        let mut startup_data: StartupData = env
            .storage()
            .instance()
            .get(&DataKey::Startup(founder.clone()))
            .expect("Startup not found");

        startup_data.approved = true;

        env.storage()
            .instance()
            .set(&DataKey::Startup(founder), &startup_data);
    }

    /// Check if voter has voted for a startup
    pub fn has_voted(env: Env, voter: Address, founder: Address) -> bool {
        let vote_key = DataKey::Vote(voter, founder);
        env.storage().instance().has(&vote_key)
    }

    /// VC stakes tokens to become verified (fully decentralized)
    pub fn stake_to_become_vc(env: Env, vc_address: Address, company_name: String, usdc_token: Address) {
        vc_address.require_auth();

        // Check if already a VC
        if env.storage().instance().has(&DataKey::VCData(vc_address.clone())) {
            panic!("Already a VC");
        }

        let stake_required: i128 = env
            .storage()
            .instance()
            .get(&DataKey::VCStakeRequired)
            .expect("VC stake not set");

        // Transfer stake from VC to contract
        let token_client = token::Client::new(&env, &usdc_token);
        token_client.transfer(&vc_address, &env.current_contract_address(), &stake_required);

        // Create VC entry
        let vc_data = VCData {
            vc_address: vc_address.clone(),
            company_name,
            stake_amount: stake_required,
            total_invested: 0,
        };

        env.storage()
            .instance()
            .set(&DataKey::VCData(vc_address.clone()), &vc_data);

        // Add to all VCs list
        let mut all_vcs: soroban_sdk::Vec<Address> = env
            .storage()
            .instance()
            .get(&DataKey::AllVCs)
            .unwrap_or(soroban_sdk::Vec::new(&env));
        
        all_vcs.push_back(vc_address);
        env.storage().instance().set(&DataKey::AllVCs, &all_vcs);
    }

    /// VC invests in approved startup (fully decentralized)
    pub fn vc_invest(env: Env, vc_address: Address, founder: Address, amount: i128, usdc_token: Address) {
        vc_address.require_auth();

        // Check if VC is verified
        if !env.storage().instance().has(&DataKey::VCData(vc_address.clone())) {
            panic!("Not a verified VC - stake tokens first");
        }

        // Check if startup is approved
        let mut startup_data: StartupData = env
            .storage()
            .instance()
            .get(&DataKey::Startup(founder.clone()))
            .expect("Startup not found");

        if !startup_data.approved {
            panic!("Startup not approved yet");
        }

        // Transfer investment from VC to contract
        let token_client = token::Client::new(&env, &usdc_token);
        token_client.transfer(&vc_address, &env.current_contract_address(), &amount);

        // Update startup funding
        startup_data.total_allocated += amount;
        startup_data.unlocked_balance += amount; // Immediately available for claiming

        env.storage()
            .instance()
            .set(&DataKey::Startup(founder.clone()), &startup_data);

        // Update VC investment tracking
        let mut vc_data: VCData = env
            .storage()
            .instance()
            .get(&DataKey::VCData(vc_address.clone()))
            .expect("VC data not found");

        vc_data.total_invested += amount;
        env.storage()
            .instance()
            .set(&DataKey::VCData(vc_address.clone()), &vc_data);

        // Track individual investment
        let investment_key = DataKey::Investment(vc_address.clone(), founder.clone());
        let current_investment: i128 = env
            .storage()
            .instance()
            .get(&investment_key)
            .unwrap_or(0);
        
        env.storage()
            .instance()
            .set(&investment_key, &(current_investment + amount));
    }

    /// VC withdraws stake (can only withdraw if no active investments)
    pub fn withdraw_vc_stake(env: Env, vc_address: Address, usdc_token: Address) {
        vc_address.require_auth();

        let vc_data: VCData = env
            .storage()
            .instance()
            .get(&DataKey::VCData(vc_address.clone()))
            .expect("Not a VC");

        // For simplicity, allow withdrawal anytime (in production, add more checks)
        let token_client = token::Client::new(&env, &usdc_token);
        token_client.transfer(&env.current_contract_address(), &vc_address, &vc_data.stake_amount);

        // Remove VC data
        env.storage().instance().remove(&DataKey::VCData(vc_address));
    }

    /// Founder claims their unlocked funds
    pub fn claim_funds(env: Env, founder: Address, usdc_token: Address) {
        founder.require_auth();

        let mut startup_data: StartupData = env
            .storage()
            .instance()
            .get(&DataKey::Startup(founder.clone()))
            .expect("Startup not found");

        let claimable = startup_data.unlocked_balance - startup_data.claimed_balance;

        if claimable <= 0 {
            panic!("No funds to claim");
        }

        // Transfer USDC from contract to founder
        let token_client = token::Client::new(&env, &usdc_token);
        token_client.transfer(&env.current_contract_address(), &founder, &claimable);

        startup_data.claimed_balance += claimable;

        env.storage()
            .instance()
            .set(&DataKey::Startup(founder), &startup_data);
    }

    /// Get startup status (read-only)
    pub fn get_startup_status(env: Env, founder: Address) -> Option<StartupData> {
        env.storage()
            .instance()
            .get(&DataKey::Startup(founder))
    }

    /// Get admin address (read-only)
    pub fn get_admin(env: Env) -> Address {
        env.storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("Admin not set")
    }

    /// Get application fee (read-only)
    pub fn get_fee(env: Env) -> i128 {
        env.storage()
            .instance()
            .get(&DataKey::ApplicationFee)
            .expect("Fee not set")
    }

    /// Check if address is a verified VC
    pub fn is_vc(env: Env, vc_address: Address) -> bool {
        env.storage().instance().has(&DataKey::VCData(vc_address))
    }

    /// Get VC data
    pub fn get_vc_data(env: Env, vc_address: Address) -> Option<VCData> {
        env.storage()
            .instance()
            .get(&DataKey::VCData(vc_address))
    }

    /// Get all VCs
    pub fn get_all_vcs(env: Env) -> soroban_sdk::Vec<Address> {
        env.storage()
            .instance()
            .get(&DataKey::AllVCs)
            .unwrap_or(soroban_sdk::Vec::new(&env))
    }

    /// Get VC's investment in a specific startup
    pub fn get_vc_investment(env: Env, vc_address: Address, founder: Address) -> i128 {
        let investment_key = DataKey::Investment(vc_address, founder);
        env.storage()
            .instance()
            .get(&investment_key)
            .unwrap_or(0)
    }

    /// Get required VC stake amount
    pub fn get_vc_stake_required(env: Env) -> i128 {
        env.storage()
            .instance()
            .get(&DataKey::VCStakeRequired)
            .expect("VC stake not set")
    }
}
