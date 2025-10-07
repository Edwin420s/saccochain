module saccochain::credit_oracle {
    use std::string;
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::event;
    use sui::vec_map;
    use sui::vec_set;

    /// Oracle that provides verified credit data from external sources
    struct CreditOracle has key {
        id: UID,
        owner: address,
        is_active: bool,
        approved_sources: vec_set::VecSet<address>,
        min_confidence: u8
    }

    /// Verified credit data from external source
    struct VerifiedCreditData has key, store {
        id: UID,
        member_address: address,
        data_source: address,
        credit_score: u64,
        confidence_score: u8,
        data_hash: vector<u8>,
        timestamp: u64,
        is_verified: bool
    }

    /// Data source registration
    struct DataSource has key {
        id: UID,
        source_address: address,
        source_name: string::String,
        is_approved: bool,
        reputation_score: u8
    }

    /// Events
    struct CreditDataVerified has copy, drop {
        member_address: address,
        data_source: address,
        credit_score: u64,
        confidence_score: u8,
        timestamp: u64
    }

    struct DataSourceRegistered has copy, drop {
        source_address: address,
        source_name: string::String,
        timestamp: u64
    }

    // ========== Oracle Management ==========

    /// Initialize credit oracle
    public entry fun initialize_oracle(
        min_confidence: u8,
        ctx: &mut TxContext
    ) {
        let oracle = CreditOracle {
            id: object::new(ctx),
            owner: tx_context::sender(ctx),
            is_active: true,
            approved_sources: vec_set::empty(),
            min_confidence
        };

        transfer::transfer(oracle, tx_context::sender(ctx));
    }

    /// Register a data source
    public entry fun register_data_source(
        oracle: &mut CreditOracle,
        source_address: address,
        source_name: vector<u8>,
        ctx: &mut TxContext
    ) {
        assert!(oracle.is_active, 2001);
        assert!(tx_context::sender(ctx) == oracle.owner, 2002);

        let data_source = DataSource {
            id: object::new(ctx),
            source_address,
            source_name: string::utf8(source_name),
            is_approved: true,
            reputation_score: 80 // Initial reputation score
        };

        vec_set::insert(&mut oracle.approved_sources, source_address);
        transfer::transfer(data_source, tx_context::sender(ctx));

        event::emit(DataSourceRegistered {
            source_address,
            source_name: string::utf8(source_name),
            timestamp: tx_context::epoch(ctx)
        });
    }

    // ========== Credit Data Verification ==========

    /// Submit credit data for verification
    public entry fun submit_credit_data(
        oracle: &mut CreditOracle,
        member_address: address,
        credit_score: u64,
        confidence_score: u8,
        data_hash: vector<u8>,
        ctx: &mut TxContext
    ) {
        assert!(oracle.is_active, 2003);
        assert!(vec_set::contains(&oracle.approved_sources, tx_context::sender(ctx)), 2004);

        let is_verified = confidence_score >= oracle.min_confidence;

        let verified_data = VerifiedCreditData {
            id: object::new(ctx),
            member_address,
            data_source: tx_context::sender(ctx),
            credit_score,
            confidence_score,
            data_hash,
            timestamp: tx_context::epoch(ctx),
            is_verified
        };

        transfer::transfer(verified_data, tx_context::sender(ctx));

        if (is_verified) {
            event::emit(CreditDataVerified {
                member_address,
                data_source: tx_context::sender(ctx),
                credit_score,
                confidence_score,
                timestamp: tx_context::epoch(ctx)
            });
        }
    }

    /// Get verified credit data
    public fun get_verified_score(data: &VerifiedCreditData): u64 {
        data.credit_score
    }

    /// Check if data is verified
    public fun is_data_verified(data: &VerifiedCreditData): bool {
        data.is_verified
    }

    /// Update data source reputation
    public entry fun update_source_reputation(
        source: &mut DataSource,
        new_reputation: u8
    ) {
        source.reputation_score = new_reputation;
        if (new_reputation < 50) {
            source.is_approved = false;
        }
    }
}