#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, token, Address, Env, String,
};

mod test;

#[derive(Clone)]
#[contracttype]
pub struct StartupData {
    pub url_or_hash: String,
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
pub struct VCRequest {
    pub vc_address: Address,
    pub company_name: String,
    pub approved: bool,
}

#[contracttype]
pub enum DataKey {
    Admin,
    ApplicationFee,
    Startup(Address),
    VCApproved(Address),
    VCRequest(Address),
    Vote(Address, Address), // (voter_address, founder_address)
}

#[contract]
pub struct DeCoMVP;

#[contractimpl]
impl DeCoMVP {
    /// Initialize the contract with admin address and application fee in XLM (stroops)
    pub fn init(env: Env, admin: Address, fee: i128) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Contract already initialized");
        }
        
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::ApplicationFee, &fee);
    }

    /// Founder applies by submitting project link
    /// Note: Application fee should be paid separately via XLM transfer to admin
    pub fn apply(env: Env, founder: Address, project_link: String) {
        founder.require_auth();

        // Check if already applied
        if env.storage().instance().has(&DataKey::Startup(founder.clone())) {
            panic!("Already applied");
        }

        // Set voting period to 7 days (in seconds)
        let voting_end_time = env.ledger().timestamp() + (7 * 24 * 60 * 60);

        // Create startup entry with voting enabled
        let startup_data = StartupData {
            url_or_hash: project_link,
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
            .set(&DataKey::Startup(founder), &startup_data);
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

    /// Admin allocates total USDC funding to a startup
    pub fn fund_startup(env: Env, admin: Address, founder: Address, total_amount: i128) {
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

        startup_data.total_allocated = total_amount;

        env.storage()
            .instance()
            .set(&DataKey::Startup(founder), &startup_data);
    }

    /// Admin unlocks milestone amount for founder to claim
    pub fn unlock_milestone(env: Env, admin: Address, founder: Address, amount_to_unlock: i128) {
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

        startup_data.unlocked_balance += amount_to_unlock;

        if startup_data.unlocked_balance > startup_data.total_allocated {
            panic!("Cannot unlock more than allocated");
        }

        env.storage()
            .instance()
            .set(&DataKey::Startup(founder), &startup_data);
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

    /// Request to become a VC
    pub fn request_vc(env: Env, vc_address: Address, company_name: String) {
        vc_address.require_auth();

        let vc_request = VCRequest {
            vc_address: vc_address.clone(),
            company_name,
            approved: false,
        };

        env.storage()
            .instance()
            .set(&DataKey::VCRequest(vc_address), &vc_request);
    }

    /// Admin approves VC request
    pub fn approve_vc(env: Env, admin: Address, vc_address: Address) {
        admin.require_auth();

        let stored_admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("Admin not set");
        
        if admin != stored_admin {
            panic!("Unauthorized: not admin");
        }

        env.storage()
            .instance()
            .set(&DataKey::VCApproved(vc_address), &true);
    }

    /// Check if address is approved VC
    pub fn is_vc(env: Env, vc_address: Address) -> bool {
        env.storage()
            .instance()
            .get(&DataKey::VCApproved(vc_address))
            .unwrap_or(false)
    }

    /// Get VC request
    pub fn get_vc_request(env: Env, vc_address: Address) -> Option<VCRequest> {
        env.storage()
            .instance()
            .get(&DataKey::VCRequest(vc_address))
    }
}
