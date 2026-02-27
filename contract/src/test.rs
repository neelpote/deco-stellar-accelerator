#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env, String};

#[test]
fn test_init() {
    let env = Env::default();
    let contract_id = env.register_contract(None, DeCoMVP);
    let client = DeCoMVPClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let fee: i128 = 100_000_000; // 10 XLM

    client.init(&admin, &fee);

    assert_eq!(client.get_admin(), admin);
    assert_eq!(client.get_fee(), fee);
}

#[test]
fn test_apply() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register_contract(None, DeCoMVP);
    let client = DeCoMVPClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let founder = Address::generate(&env);
    let fee: i128 = 100_000_000;

    client.init(&admin, &fee);

    let project_url = String::from_str(&env, "https://github.com/myproject");
    client.apply(&founder, &project_url);

    let status = client.get_startup_status(&founder);
    assert!(status.is_some());
    
    let data = status.unwrap();
    assert_eq!(data.url_or_hash, project_url);
    assert_eq!(data.total_allocated, 0);
    assert_eq!(data.unlocked_balance, 0);
    assert_eq!(data.claimed_balance, 0);
}

#[test]
fn test_fund_startup() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register_contract(None, DeCoMVP);
    let client = DeCoMVPClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let founder = Address::generate(&env);
    let fee: i128 = 100_000_000;

    client.init(&admin, &fee);

    let project_url = String::from_str(&env, "https://github.com/myproject");
    client.apply(&founder, &project_url);

    let funding_amount: i128 = 100_000_000_000; // 10,000 USDC
    client.fund_startup(&admin, &founder, &funding_amount);

    let status = client.get_startup_status(&founder).unwrap();
    assert_eq!(status.total_allocated, funding_amount);
}

#[test]
fn test_unlock_milestone() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register_contract(None, DeCoMVP);
    let client = DeCoMVPClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let founder = Address::generate(&env);
    let fee: i128 = 100_000_000;

    client.init(&admin, &fee);

    let project_url = String::from_str(&env, "https://github.com/myproject");
    client.apply(&founder, &project_url);

    let funding_amount: i128 = 100_000_000_000;
    client.fund_startup(&admin, &founder, &funding_amount);

    let unlock_amount: i128 = 25_000_000_000; // 2,500 USDC
    client.unlock_milestone(&admin, &founder, &unlock_amount);

    let status = client.get_startup_status(&founder).unwrap();
    assert_eq!(status.unlocked_balance, unlock_amount);
}

#[test]
fn test_full_flow() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register_contract(None, DeCoMVP);
    let client = DeCoMVPClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let founder = Address::generate(&env);
    let fee: i128 = 100_000_000;

    // Initialize
    client.init(&admin, &fee);

    // Apply
    let project_url = String::from_str(&env, "https://github.com/myproject");
    client.apply(&founder, &project_url);

    // Fund
    let total_funding: i128 = 100_000_000_000;
    client.fund_startup(&admin, &founder, &total_funding);

    // Unlock first milestone
    let milestone1: i128 = 25_000_000_000;
    client.unlock_milestone(&admin, &founder, &milestone1);

    let status = client.get_startup_status(&founder).unwrap();
    assert_eq!(status.total_allocated, total_funding);
    assert_eq!(status.unlocked_balance, milestone1);
    assert_eq!(status.claimed_balance, 0);

    // Unlock second milestone
    let milestone2: i128 = 25_000_000_000;
    client.unlock_milestone(&admin, &founder, &milestone2);

    let status = client.get_startup_status(&founder).unwrap();
    assert_eq!(status.unlocked_balance, milestone1 + milestone2);
}

#[test]
#[should_panic(expected = "Cannot unlock more than allocated")]
fn test_unlock_exceeds_allocation() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register_contract(None, DeCoMVP);
    let client = DeCoMVPClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let founder = Address::generate(&env);
    let fee: i128 = 100_000_000;

    client.init(&admin, &fee);

    let project_url = String::from_str(&env, "https://github.com/myproject");
    client.apply(&founder, &project_url);

    let funding_amount: i128 = 100_000_000_000;
    client.fund_startup(&admin, &founder, &funding_amount);

    // Try to unlock more than allocated
    let unlock_amount: i128 = 150_000_000_000;
    client.unlock_milestone(&admin, &founder, &unlock_amount);
}

#[test]
#[should_panic(expected = "Already applied")]
fn test_duplicate_application() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register_contract(None, DeCoMVP);
    let client = DeCoMVPClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let founder = Address::generate(&env);
    let fee: i128 = 100_000_000;

    client.init(&admin, &fee);

    let project_url = String::from_str(&env, "https://github.com/myproject");
    client.apply(&founder, &project_url);
    
    // Try to apply again
    client.apply(&founder, &project_url);
}
