#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, token, Address, Env, String, Vec,
};

mod test;

// ============================================================================
// DATA STRUCTURES
// ============================================================================

#[derive(Clone)]
#[contracttype]
pub struct StartupData {
    pub ipfs_cid: String,
    pub funding_goal: i128,
    pub total_allocated: i128,
    pub unlocked_balance: i128,
    pub claimed_balance: i128,
    pub voting_end_time: u64,
    pub yes_votes: u32,
    pub no_votes: u32,
    pub approved: bool,
    pub milestone_count: u32,        // NEW: Track milestones
    pub current_milestone: u32,      // NEW: Current milestone (0-3 for 25% each)
    pub last_milestone_time: u64,    // NEW: Timestamp of last milestone unlock
}

#[derive(Clone)]
#[contracttype]
pub struct VCData {
    pub vc_address: Address,
    pub company_name: String,
    pub stake_amount: i128,
    pub total_invested: i128,
}

#[derive(Clone)]
#[contracttype]
pub struct ContractConfig {
    pub admin: Address,
    pub application_fee: i128,
    pub vc_stake_required: i128,
    pub paused: bool,                    // NEW: Circuit breaker
    pub min_vote_balance: i128,          // NEW: Sybil resistance
    pub milestone_interval: u64,         // NEW: Time between milestones (seconds)
}

#[contracttype]
pub enum DataKey {
    Config,
    Startup(Address),
    VCData(Address),
    Vote(Address, Address),
    AllStartups,
    AllVCs,
    Investment(Address, Address),
    ReentrancyGuard(Address),           // NEW: Reentrancy protection
}

// ============================================================================
// MAIN CONTRACT
// ============================================================================

#[contract]
pub struct DeCoV2;

#[contractimpl]
impl DeCoV2 {
    
    // ========================================================================
    // INITIALIZATION
    // ========================================================================
    
    /// Initialize contract with comprehensive configuration
    pub fn init(
        env: Env,
        admin: Address,
        application_fee: i128,
        vc_stake_required: i128,
        min_vote_balance: i128,
        milestone_interval: u64,
    ) {
        if env.storage().instance().has(&DataKey::Config) {
            panic!("Contract already initialized");
        }
        
        let config = ContractConfig {
            admin,
            application_fee,
            vc_stake_required,
            paused: false,
            min_vote_balance,
            milestone_interval,
        };
        
        env.storage().instance().set(&DataKey::Config, &config);
    }

    // ========================================================================
    // CIRCUIT BREAKER (Emergency Pause)
    // ========================================================================
    
    /// Emergency pause - only admin can trigger
    pub fn pause(env: Env, admin: Address) {
        admin.require_auth();
        
        let mut config: ContractConfig = env
            .storage()
            .instance()
            .get(&DataKey::Config)
            .expect("Contract not initialized");
        
        if admin != config.admin {
            panic!("Unauthorized: not admin");
        }
        
        config.paused = true;
        env.storage().instance().set(&DataKey::Config, &config);
    }
    
    /// Unpause contract - only admin
    pub fn unpause(env: Env, admin: Address) {
        admin.require_auth();
        
        let mut config: ContractConfig = env
            .storage()
            .instance()
            .get(&DataKey::Config)
            .expect("Contract not initialized");
        
        if admin != config.admin {
            panic!("Unauthorized: not admin");
        }
        
        config.paused = false;
        env.storage().instance().set(&DataKey::Config, &config);
    }
    
    /// Check if contract is paused
    fn require_not_paused(env: &Env) {
        let config: ContractConfig = env
            .storage()
            .instance()
            .get(&DataKey::Config)
            .expect("Contract not initialized");
        
        if config.paused {
            panic!("Contract is paused");
        }
    }

    // ========================================================================
    // REENTRANCY GUARD
    // ========================================================================
    
    fn acquire_lock(env: &Env, address: &Address) {
        let guard_key = DataKey::ReentrancyGuard(address.clone());
        if env.storage().instance().has(&guard_key) {
            panic!("Reentrancy detected");
        }
        env.storage().instance().set(&guard_key, &true);
    }
    
    fn release_lock(env: &Env, address: &Address) {
        let guard_key = DataKey::ReentrancyGuard(address.clone());
        env.storage().instance().remove(&guard_key);
    }

    // ========================================================================
    // CHECKED MATH HELPERS
    // ========================================================================
    
    fn checked_add(a: i128, b: i128) -> i128 {
        a.checked_add(b).expect("Overflow in addition")
    }
    
    fn checked_sub(a: i128, b: i128) -> i128 {
        a.checked_sub(b).expect("Underflow in subtraction")
    }
    
    fn checked_mul(a: i128, b: i128) -> i128 {
        a.checked_mul(b).expect("Overflow in multiplication")
    }

    // ========================================================================
    // STARTUP APPLICATION
    // ========================================================================
    
    pub fn apply(
        env: Env,
        founder: Address,
        ipfs_cid: String,
        funding_goal: i128,
    ) {
        founder.require_auth();
        Self::require_not_paused(&env);

        if env.storage().instance().has(&DataKey::Startup(founder.clone())) {
            panic!("Already applied");
        }

        let config: ContractConfig = env
            .storage()
            .instance()
            .get(&DataKey::Config)
            .expect("Contract not initialized");

        let voting_end_time = Self::checked_add(
            env.ledger().timestamp() as i128,
            (7 * 24 * 60 * 60) as i128
        ) as u64;

        let startup_data = StartupData {
            ipfs_cid,
            funding_goal,
            total_allocated: 0,
            unlocked_balance: 0,
            claimed_balance: 0,
            voting_end_time,
            yes_votes: 0,
            no_votes: 0,
            approved: false,
            milestone_count: 4,              // 4 milestones = 25% each
            current_milestone: 0,
            last_milestone_time: 0,
        };

        env.storage()
            .instance()
            .set(&DataKey::Startup(founder.clone()), &startup_data);

        let mut all_startups: Vec<Address> = env
            .storage()
            .instance()
            .get(&DataKey::AllStartups)
            .unwrap_or(Vec::new(&env));
        
        all_startups.push_back(founder);
        env.storage().instance().set(&DataKey::AllStartups, &all_startups);
    }

    // ========================================================================
    // VOTING WITH SYBIL RESISTANCE
    // ========================================================================
    
    pub fn vote(
        env: Env,
        voter: Address,
        founder: Address,
        vote_yes: bool,
        xlm_token: Address,
    ) {
        voter.require_auth();
        Self::require_not_paused(&env);

        let config: ContractConfig = env
            .storage()
            .instance()
            .get(&DataKey::Config)
            .expect("Contract not initialized");

        // SYBIL RESISTANCE: Check voter has minimum XLM balance
        let token_client = token::Client::new(&env, &xlm_token);
        let voter_balance = token_client.balance(&voter);
        
        if voter_balance < config.min_vote_balance {
            panic!("Insufficient balance to vote - Sybil resistance");
        }

        let mut startup_data: StartupData = env
            .storage()
            .instance()
            .get(&DataKey::Startup(founder.clone()))
            .expect("Startup not found");

        if env.ledger().timestamp() > startup_data.voting_end_time {
            panic!("Voting period has ended");
        }

        let vote_key = DataKey::Vote(voter.clone(), founder.clone());
        if env.storage().instance().has(&vote_key) {
            panic!("Already voted");
        }

        env.storage().instance().set(&vote_key, &vote_yes);

        if vote_yes {
            startup_data.yes_votes = startup_data.yes_votes.checked_add(1).expect("Vote overflow");
        } else {
            startup_data.no_votes = startup_data.no_votes.checked_add(1).expect("Vote overflow");
        }

        env.storage()
            .instance()
            .set(&DataKey::Startup(founder), &startup_data);
    }

    // ========================================================================
    // ADMIN APPROVAL
    // ========================================================================
    
    pub fn approve_application(env: Env, admin: Address, founder: Address) {
        admin.require_auth();
        Self::require_not_paused(&env);

        let config: ContractConfig = env
            .storage()
            .instance()
            .get(&DataKey::Config)
            .expect("Contract not initialized");
        
        if admin != config.admin {
            panic!("Unauthorized: not admin");
        }

        let mut startup_data: StartupData = env
            .storage()
            .instance()
            .get(&DataKey::Startup(founder.clone()))
            .expect("Startup not found");

        startup_data.approved = true;
        startup_data.last_milestone_time = env.ledger().timestamp();

        env.storage()
            .instance()
            .set(&DataKey::Startup(founder), &startup_data);
    }

    // ========================================================================
    // VC STAKING (WITH REENTRANCY GUARD)
    // ========================================================================
    
    pub fn stake_to_become_vc(
        env: Env,
        vc_address: Address,
        company_name: String,
        xlm_token: Address,
    ) {
        vc_address.require_auth();
        Self::require_not_paused(&env);
        Self::acquire_lock(&env, &vc_address);

        if env.storage().instance().has(&DataKey::VCData(vc_address.clone())) {
            Self::release_lock(&env, &vc_address);
            panic!("Already a VC");
        }

        let config: ContractConfig = env
            .storage()
            .instance()
            .get(&DataKey::Config)
            .expect("Contract not initialized");

        let token_client = token::Client::new(&env, &xlm_token);
        token_client.transfer(
            &vc_address,
            &env.current_contract_address(),
            &config.vc_stake_required
        );

        let vc_data = VCData {
            vc_address: vc_address.clone(),
            company_name,
            stake_amount: config.vc_stake_required,
            total_invested: 0,
        };

        env.storage()
            .instance()
            .set(&DataKey::VCData(vc_address.clone()), &vc_data);

        let mut all_vcs: Vec<Address> = env
            .storage()
            .instance()
            .get(&DataKey::AllVCs)
            .unwrap_or(Vec::new(&env));

        all_vcs.push_back(vc_address.clone());
        env.storage().instance().set(&DataKey::AllVCs, &all_vcs);

        Self::release_lock(&env, &vc_address);
    }

    // ========================================================================
    // VC INVESTMENT (WITH REENTRANCY GUARD & CHECKED MATH)
    // ========================================================================
    
    pub fn vc_invest(
        env: Env,
        vc_address: Address,
        founder: Address,
        amount: i128,
        xlm_token: Address,
    ) {
        vc_address.require_auth();
        Self::require_not_paused(&env);
        Self::acquire_lock(&env, &vc_address);

        if !env.storage().instance().has(&DataKey::VCData(vc_address.clone())) {
            Self::release_lock(&env, &vc_address);
            panic!("Not a verified VC");
        }

        let mut startup_data: StartupData = env
            .storage()
            .instance()
            .get(&DataKey::Startup(founder.clone()))
            .expect("Startup not found");

        if !startup_data.approved {
            Self::release_lock(&env, &vc_address);
            panic!("Startup not approved");
        }

        let token_client = token::Client::new(&env, &xlm_token);
        token_client.transfer(&vc_address, &env.current_contract_address(), &amount);

        // CHECKED MATH
        startup_data.total_allocated = Self::checked_add(startup_data.total_allocated, amount);
        
        // Funds go to escrow, not immediately unlocked
        // Will be unlocked via milestone system

        env.storage()
            .instance()
            .set(&DataKey::Startup(founder.clone()), &startup_data);

        let mut vc_data: VCData = env
            .storage()
            .instance()
            .get(&DataKey::VCData(vc_address.clone()))
            .expect("VC data not found");

        vc_data.total_invested = Self::checked_add(vc_data.total_invested, amount);
        env.storage()
            .instance()
            .set(&DataKey::VCData(vc_address.clone()), &vc_data);

        let investment_key = DataKey::Investment(vc_address.clone(), founder.clone());
        let current_investment: i128 = env
            .storage()
            .instance()
            .get(&investment_key)
            .unwrap_or(0);

        env.storage()
            .instance()
            .set(&investment_key, &Self::checked_add(current_investment, amount));

        Self::release_lock(&env, &vc_address);
    }

    // ========================================================================
    // MILESTONE-BASED FUND RELEASE (25% INCREMENTS)
    // ========================================================================
    
    /// Unlock next milestone (25% of total allocated)
    /// Can be triggered by admin or automatically after time interval
    pub fn unlock_milestone(
        env: Env,
        admin: Address,
        founder: Address,
    ) {
        admin.require_auth();
        Self::require_not_paused(&env);

        let config: ContractConfig = env
            .storage()
            .instance()
            .get(&DataKey::Config)
            .expect("Contract not initialized");
        
        if admin != config.admin {
            panic!("Unauthorized: not admin");
        }

        let mut startup_data: StartupData = env
            .storage()
            .instance()
            .get(&DataKey::Startup(founder.clone()))
            .expect("Startup not found");

        if !startup_data.approved {
            panic!("Startup not approved");
        }

        if startup_data.current_milestone >= startup_data.milestone_count {
            panic!("All milestones already unlocked");
        }

        // Check if enough time has passed since last milestone
        let time_since_last = Self::checked_sub(
            env.ledger().timestamp() as i128,
            startup_data.last_milestone_time as i128
        );
        
        if time_since_last < config.milestone_interval as i128 {
            panic!("Milestone interval not reached");
        }

        // Calculate 25% of total allocated
        let milestone_amount = Self::checked_mul(
            startup_data.total_allocated,
            25
        ) / 100;

        startup_data.unlocked_balance = Self::checked_add(
            startup_data.unlocked_balance,
            milestone_amount
        );
        
        startup_data.current_milestone = startup_data.current_milestone.checked_add(1).expect("Milestone overflow");
        startup_data.last_milestone_time = env.ledger().timestamp();

        env.storage()
            .instance()
            .set(&DataKey::Startup(founder), &startup_data);
    }

    // ========================================================================
    // CLAIM FUNDS (WITH REENTRANCY GUARD & CHECKED MATH)
    // ========================================================================
    
    pub fn claim_funds(env: Env, founder: Address, xlm_token: Address) {
        founder.require_auth();
        Self::require_not_paused(&env);
        Self::acquire_lock(&env, &founder);

        let mut startup_data: StartupData = env
            .storage()
            .instance()
            .get(&DataKey::Startup(founder.clone()))
            .expect("Startup not found");

        let claimable = Self::checked_sub(
            startup_data.unlocked_balance,
            startup_data.claimed_balance
        );

        if claimable <= 0 {
            Self::release_lock(&env, &founder);
            panic!("No funds to claim");
        }

        // Update state BEFORE transfer (checks-effects-interactions pattern)
        startup_data.claimed_balance = Self::checked_add(
            startup_data.claimed_balance,
            claimable
        );

        env.storage()
            .instance()
            .set(&DataKey::Startup(founder.clone()), &startup_data);

        // Transfer after state update
        let token_client = token::Client::new(&env, &xlm_token);
        token_client.transfer(&env.current_contract_address(), &founder, &claimable);

        Self::release_lock(&env, &founder);
    }

    // ========================================================================
    // CONFIGURATION UPDATES
    // ========================================================================
    
    /// Update VC stake requirement (admin only)
    pub fn update_vc_stake_required(env: Env, admin: Address, new_amount: i128) {
        admin.require_auth();
        
        let mut config: ContractConfig = env
            .storage()
            .instance()
            .get(&DataKey::Config)
            .expect("Contract not initialized");
        
        if admin != config.admin {
            panic!("Unauthorized: not admin");
        }
        
        config.vc_stake_required = new_amount;
        env.storage().instance().set(&DataKey::Config, &config);
    }
    
    /// Update minimum vote balance (admin only)
    pub fn update_min_vote_balance(env: Env, admin: Address, new_amount: i128) {
        admin.require_auth();
        
        let mut config: ContractConfig = env
            .storage()
            .instance()
            .get(&DataKey::Config)
            .expect("Contract not initialized");
        
        if admin != config.admin {
            panic!("Unauthorized: not admin");
        }
        
        config.min_vote_balance = new_amount;
        env.storage().instance().set(&DataKey::Config, &config);
    }

    // ========================================================================
    // READ-ONLY FUNCTIONS
    // ========================================================================
    
    pub fn get_config(env: Env) -> ContractConfig {
        env.storage()
            .instance()
            .get(&DataKey::Config)
            .expect("Contract not initialized")
    }
    
    pub fn get_startup_status(env: Env, founder: Address) -> Option<StartupData> {
        env.storage().instance().get(&DataKey::Startup(founder))
    }
    
    pub fn get_vc_data(env: Env, vc_address: Address) -> Option<VCData> {
        env.storage().instance().get(&DataKey::VCData(vc_address))
    }
    
    pub fn get_all_startups(env: Env) -> Vec<Address> {
        env.storage()
            .instance()
            .get(&DataKey::AllStartups)
            .unwrap_or(Vec::new(&env))
    }
    
    pub fn get_all_vcs(env: Env) -> Vec<Address> {
        env.storage()
            .instance()
            .get(&DataKey::AllVCs)
            .unwrap_or(Vec::new(&env))
    }
    
    pub fn has_voted(env: Env, voter: Address, founder: Address) -> bool {
        env.storage().instance().has(&DataKey::Vote(voter, founder))
    }
    
    pub fn is_vc(env: Env, vc_address: Address) -> bool {
        env.storage().instance().has(&DataKey::VCData(vc_address))
    }
    
    pub fn get_vc_investment(env: Env, vc_address: Address, founder: Address) -> i128 {
        env.storage()
            .instance()
            .get(&DataKey::Investment(vc_address, founder))
            .unwrap_or(0)
    }
}
