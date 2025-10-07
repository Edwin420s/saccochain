module saccochain::credit_registry {
    use std::signer;
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};

    struct CreditRecord has key {
        id: UID,
        owner: address,
        score_hash: vector<u8>,
        timestamp: u64,
        sacco_id: vector<u8>
    }

    struct SaccoRegistry has key {
        id: UID,
        sacco_id: vector<u8>,
        name: vector<u8>,
        registered_at: u64
    }

    public entry fun register_sacco(
        sacco_id: vector<u8>,
        name: vector<u8>,
        ctx: &mut TxContext
    ) {
        let sacco_registry = SaccoRegistry {
            id: object::new(ctx),
            sacco_id,
            name,
            registered_at: tx_context::epoch(ctx)
        };
        transfer::public_transfer(sacco_registry, tx_context::sender(ctx));
    }

    public entry fun store_credit_record(
        score_hash: vector<u8>,
        sacco_id: vector<u8>,
        ctx: &mut TxContext
    ) {
        let credit_record = CreditRecord {
            id: object::new(ctx),
            owner: tx_context::sender(ctx),
            score_hash,
            timestamp: tx_context::epoch(ctx),
            sacco_id
        };
        transfer::public_transfer(credit_record, tx_context::sender(ctx));
    }

    public fun get_credit_record_address(record: &CreditRecord): address {
        record.owner
    }

    public fun get_score_hash(record: &CreditRecord): &vector<u8> {
        &record.score_hash
    }
}