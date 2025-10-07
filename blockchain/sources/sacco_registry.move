module saccochain::sacco_registry {
    use std::string;
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::event;

    /// SACCO registration information
    struct Sacco has key, store {
        id: UID,
        sacco_id: string::String,
        name: string::String,
        license_number: string::String,
        registration_date: u64,
        owner: address,
        is_active: bool
    }

    /// Member registration in a SACCO
    struct SaccoMember has key, store {
        id: UID,
        sacco_id: string::String,
        member_address: address,
        national_id: string::String,
        join_date: u64,
        status: string::String // "ACTIVE", "SUSPENDED", "INACTIVE"
    }

    /// Credit record stored on-chain
    struct CreditRecord has key, store {
        id: UID,
        member_address: address,
        sacco_id: string::String,
        credit_score: u64,
        risk_level: string::String, // "LOW", "MEDIUM", "HIGH"
        score_hash: vector<u8>,
        timestamp: u64,
        calculated_by: address
    }

    /// Loan agreement stored on-chain
    struct LoanAgreement has key, store {
        id: UID,
        member_address: address,
        sacco_id: string::String,
        loan_amount: u64,
        interest_rate: u64,
        duration_months: u64,
        start_date: u64,
        status: string::String, // "PENDING", "APPROVED", "REJECTED", "ACTIVE", "COMPLETED", "DEFAULTED"
        agreement_hash: vector<u8>
    }

    /// Events
    struct SaccoRegistered has copy, drop {
        sacco_id: string::String,
        name: string::String,
        owner: address,
        timestamp: u64
    }

    struct MemberRegistered has copy, drop {
        sacco_id: string::String,
        member_address: address,
        national_id: string::String,
        timestamp: u64
    }

    struct CreditScoreStored has copy, drop {
        member_address: address,
        sacco_id: string::String,
        credit_score: u64,
        risk_level: string::String,
        timestamp: u64
    }

    struct LoanAgreementCreated has copy, drop {
        member_address: address,
        sacco_id: string::String,
        loan_amount: u64,
        status: string::String,
        timestamp: u64
    }

    // ========== SACCO Management Functions ==========

    /// Register a new SACCO
    public entry fun register_sacco(
        sacco_id: vector<u8>,
        name: vector<u8>,
        license_number: vector<u8>,
        ctx: &mut TxContext
    ) {
        let sacco = Sacco {
            id: object::new(ctx),
            sacco_id: string::utf8(sacco_id),
            name: string::utf8(name),
            license_number: string::utf8(license_number),
            registration_date: tx_context::epoch(ctx),
            owner: tx_context::sender(ctx),
            is_active: true
        };

        transfer::public_transfer(sacco, tx_context::sender(ctx));

        // Emit event
        event::emit(SaccoRegistered {
            sacco_id: string::utf8(sacco_id),
            name: string::utf8(name),
            owner: tx_context::sender(ctx),
            timestamp: tx_context::epoch(ctx)
        });
    }

    /// Register a member to a SACCO
    public entry fun register_member(
        sacco: &mut Sacco,
        national_id: vector<u8>,
        ctx: &mut TxContext
    ) {
        assert!(sacco.is_active, 1001); // SACCO must be active
        assert!(tx_context::sender(ctx) == sacco.owner, 1002); // Only SACCO owner can register members

        let member = SaccoMember {
            id: object::new(ctx),
            sacco_id: sacco.sacco_id,
            member_address: tx_context::sender(ctx),
            national_id: string::utf8(national_id),
            join_date: tx_context::epoch(ctx),
            status: string::utf8(b"ACTIVE")
        };

        transfer::public_transfer(member, tx_context::sender(ctx));

        // Emit event
        event::emit(MemberRegistered {
            sacco_id: sacco.sacco_id,
            member_address: tx_context::sender(ctx),
            national_id: string::utf8(national_id),
            timestamp: tx_context::epoch(ctx)
        });
    }

    // ========== Credit Scoring Functions ==========

    /// Store credit score on-chain
    public entry fun store_credit_score(
        sacco_id: vector<u8>,
        credit_score: u64,
        risk_level: vector<u8>,
        score_hash: vector<u8>,
        ctx: &mut TxContext
    ) {
        let credit_record = CreditRecord {
            id: object::new(ctx),
            member_address: tx_context::sender(ctx),
            sacco_id: string::utf8(sacco_id),
            credit_score,
            risk_level: string::utf8(risk_level),
            score_hash,
            timestamp: tx_context::epoch(ctx),
            calculated_by: tx_context::sender(ctx)
        };

        transfer::public_transfer(credit_record, tx_context::sender(ctx));

        // Emit event
        event::emit(CreditScoreStored {
            member_address: tx_context::sender(ctx),
            sacco_id: string::utf8(sacco_id),
            credit_score,
            risk_level: string::utf8(risk_level),
            timestamp: tx_context::epoch(ctx)
        });
    }

    /// Get credit score for a member
    public fun get_credit_score(record: &CreditRecord): u64 {
        record.credit_score
    }

    /// Get risk level for a member
    public fun get_risk_level(record: &CreditRecord): &string::String {
        &record.risk_level
    }

    // ========== Loan Management Functions ==========

    /// Create a loan agreement
    public entry fun create_loan_agreement(
        sacco_id: vector<u8>,
        loan_amount: u64,
        interest_rate: u64,
        duration_months: u64,
        agreement_hash: vector<u8>,
        ctx: &mut TxContext
    ) {
        let loan_agreement = LoanAgreement {
            id: object::new(ctx),
            member_address: tx_context::sender(ctx),
            sacco_id: string::utf8(sacco_id),
            loan_amount,
            interest_rate,
            duration_months,
            start_date: tx_context::epoch(ctx),
            status: string::utf8(b"PENDING"),
            agreement_hash
        };

        transfer::public_transfer(loan_agreement, tx_context::sender(ctx));

        // Emit event
        event::emit(LoanAgreementCreated {
            member_address: tx_context::sender(ctx),
            sacco_id: string::utf8(sacco_id),
            loan_amount,
            status: string::utf8(b"PENDING"),
            timestamp: tx_context::epoch(ctx)
        });
    }

    /// Approve a loan
    public entry fun approve_loan(
        loan: &mut LoanAgreement,
        approver: address
    ) {
        assert!(loan.status == string::utf8(b"PENDING"), 1003); // Only pending loans can be approved
        loan.status = string::utf8(b"APPROVED");
    }

    /// Reject a loan
    public entry fun reject_loan(
        loan: &mut LoanAgreement,
        rejector: address
    ) {
        assert!(loan.status == string::utf8(b"PENDING"), 1004); // Only pending loans can be rejected
        loan.status = string::utf8(b"REJECTED");
    }

    /// Mark loan as active (disbursed)
    public entry fun activate_loan(
        loan: &mut LoanAgreement
    ) {
        assert!(loan.status == string::utf8(b"APPROVED"), 1005); // Only approved loans can be activated
        loan.status = string::utf8(b"ACTIVE");
    }

    /// Complete loan repayment
    public entry fun complete_loan(
        loan: &mut LoanAgreement
    ) {
        assert!(loan.status == string::utf8(b"ACTIVE"), 1006); // Only active loans can be completed
        loan.status = string::utf8(b"COMPLETED");
    }

    /// Mark loan as defaulted
    public entry fun default_loan(
        loan: &mut LoanAgreement
    ) {
        assert!(loan.status == string::utf8(b"ACTIVE"), 1007); // Only active loans can be defaulted
        loan.status = string::utf8(b"DEFAULTED");
    }

    // ========== Utility Functions ==========

    /// Check if a SACCO is active
    public fun is_sacco_active(sacco: &Sacco): bool {
        sacco.is_active
    }

    /// Get SACCO owner
    public fun get_sacco_owner(sacco: &Sacco): address {
        sacco.owner
    }

    /// Get member status
    public fun get_member_status(member: &SaccoMember): &string::String {
        &member.status
    }

    /// Update member status
    public entry fun update_member_status(
        member: &mut SaccoMember,
        new_status: vector<u8>
    ) {
        member.status = string::utf8(new_status);
    }

    /// Verify credit score hash
    public fun verify_score_hash(record: &CreditRecord, hash: vector<u8>): bool {
        record.score_hash == hash
    }

    /// Get loan status
    public fun get_loan_status(loan: &LoanAgreement): &string::String {
        &loan.status
    }
}