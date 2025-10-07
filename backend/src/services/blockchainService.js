const { SuiClient, getFullnodeUrl } = require('@mysten/sui.js/client');
const { TransactionBlock } = require('@mysten/sui.js/transactions');
const { Ed25519Keypair } = require('@mysten/sui.js/keypairs/ed25519');
const { fromB64 } = require('@mysten/sui.js/utils');
const crypto = require('crypto');

class BlockchainService {
  constructor() {
    this.client = new SuiClient({ 
      url: getFullnodeUrl(process.env.SUI_NETWORK || 'testnet') 
    });
    this.keypair = this.getKeypair();
    this.packageId = process.env.SUI_PACKAGE_ID;
  }

  getKeypair() {
    const privateKey = process.env.SUI_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('SUI_PRIVATE_KEY environment variable is required');
    }
    return Ed25519Keypair.fromSecretKey(fromB64(privateKey));
  }

  /**
   * Generate hash for data verification
   */
  generateHash(data) {
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(data))
      .digest('hex');
  }

  /**
   * Register a SACCO on blockchain
   */
  async registerSacco(saccoId, name, licenseNumber) {
    try {
      const tx = new TransactionBlock();
      
      tx.moveCall({
        target: `${this.packageId}::sacco_registry::register_sacco`,
        arguments: [
          tx.pure(Array.from(Buffer.from(saccoId, 'utf8'))),
          tx.pure(Array.from(Buffer.from(name, 'utf8'))),
          tx.pure(Array.from(Buffer.from(licenseNumber, 'utf8')))
        ],
      });

      const result = await this.client.signAndExecuteTransactionBlock({
        transactionBlock: tx,
        signer: this.keypair,
        options: {
          showEffects: true,
          showObjectChanges: true,
        },
      });

      return {
        success: true,
        transactionDigest: result.digest,
        effects: result.effects,
        message: 'SACCO registered on blockchain successfully'
      };
    } catch (error) {
      console.error('Error registering SACCO on blockchain:', error);
      throw new Error(`Failed to register SACCO: ${error.message}`);
    }
  }

  /**
   * Store credit score on blockchain
   */
  async storeCreditScore(userData, creditScore, riskLevel) {
    try {
      const tx = new TransactionBlock();
      
      const scoreData = {
        userId: userData.id,
        score: creditScore,
        riskLevel,
        calculatedAt: new Date().toISOString(),
        saccoId: userData.saccoId
      };

      const scoreHash = this.generateHash(scoreData);

      tx.moveCall({
        target: `${this.packageId}::sacco_registry::store_credit_score`,
        arguments: [
          tx.pure(Array.from(Buffer.from(userData.saccoId || 'default', 'utf8'))),
          tx.pure(creditScore),
          tx.pure(Array.from(Buffer.from(riskLevel, 'utf8'))),
          tx.pure(Array.from(Buffer.from(scoreHash, 'hex')))
        ],
      });

      const result = await this.client.signAndExecuteTransactionBlock({
        transactionBlock: tx,
        signer: this.keypair,
        options: {
          showEffects: true,
          showObjectChanges: true,
        },
      });

      return {
        success: true,
        transactionDigest: result.digest,
        scoreHash,
        message: 'Credit score stored on blockchain successfully'
      };
    } catch (error) {
      console.error('Error storing credit score on blockchain:', error);
      throw new Error(`Failed to store credit score: ${error.message}`);
    }
  }

  /**
   * Create loan agreement on blockchain
   */
  async createLoanAgreement(loanData) {
    try {
      const tx = new TransactionBlock();
      
      const agreementData = {
        loanId: loanData.id,
        userId: loanData.userId,
        amount: loanData.amount,
        interestRate: loanData.interestRate,
        duration: loanData.duration,
        createdAt: new Date().toISOString()
      };

      const agreementHash = this.generateHash(agreementData);

      tx.moveCall({
        target: `${this.packageId}::sacco_registry::create_loan_agreement`,
        arguments: [
          tx.pure(Array.from(Buffer.from(loanData.saccoId, 'utf8'))),
          tx.pure(Math.floor(loanData.amount * 100)), // Convert to smallest units
          tx.pure(Math.floor(loanData.interestRate * 100)), // Convert to basis points
          tx.pure(loanData.durationMonths),
          tx.pure(Array.from(Buffer.from(agreementHash, 'hex')))
        ],
      });

      const result = await this.client.signAndExecuteTransactionBlock({
        transactionBlock: tx,
        signer: this.keypair,
        options: {
          showEffects: true,
          showObjectChanges: true,
        },
      });

      return {
        success: true,
        transactionDigest: result.digest,
        agreementHash,
        message: 'Loan agreement created on blockchain successfully'
      };
    } catch (error) {
      console.error('Error creating loan agreement on blockchain:', error);
      throw new Error(`Failed to create loan agreement: ${error.message}`);
    }
  }

  /**
   * Get credit records for a user
   */
  async getCreditRecords(userAddress) {
    try {
      const objects = await this.client.getOwnedObjects({
        owner: userAddress,
        options: {
          showContent: true,
        },
      });

      const creditRecords = objects.data
        .filter(obj => obj.data?.type?.includes('CreditRecord'))
        .map(obj => {
          const content = obj.data.content;
          return {
            objectId: obj.data.objectId,
            creditScore: content.fields.credit_score,
            riskLevel: content.fields.risk_level,
            timestamp: new Date(Number(content.fields.timestamp)),
            saccoId: content.fields.sacco_id,
            scoreHash: Buffer.from(content.fields.score_hash).toString('hex')
          };
        });

      return {
        success: true,
        records: creditRecords,
        count: creditRecords.length
      };
    } catch (error) {
      console.error('Error fetching credit records:', error);
      throw new Error(`Failed to fetch credit records: ${error.message}`);
    }
  }

  /**
   * Get loan agreements for a user
   */
  async getLoanAgreements(userAddress) {
    try {
      const objects = await this.client.getOwnedObjects({
        owner: userAddress,
        options: {
          showContent: true,
        },
      });

      const loanAgreements = objects.data
        .filter(obj => obj.data?.type?.includes('LoanAgreement'))
        .map(obj => {
          const content = obj.data.content;
          return {
            objectId: obj.data.objectId,
            loanAmount: content.fields.loan_amount,
            interestRate: content.fields.interest_rate / 100, // Convert from basis points
            durationMonths: content.fields.duration_months,
            status: content.fields.status,
            startDate: new Date(Number(content.fields.start_date)),
            saccoId: content.fields.sacco_id
          };
        });

      return {
        success: true,
        agreements: loanAgreements,
        count: loanAgreements.length
      };
    } catch (error) {
      console.error('Error fetching loan agreements:', error);
      throw new Error(`Failed to fetch loan agreements: ${error.message}`);
    }
  }

  /**
   * Verify credit score hash on blockchain
   */
  async verifyCreditScore(userAddress, expectedHash) {
    try {
      const records = await this.getCreditRecords(userAddress);
      
      const matchingRecord = records.records.find(
        record => record.scoreHash === expectedHash
      );

      return {
        verified: !!matchingRecord,
        record: matchingRecord,
        message: matchingRecord 
          ? 'Credit score verified on blockchain' 
          : 'Credit score verification failed'
      };
    } catch (error) {
      console.error('Error verifying credit score:', error);
      throw new Error(`Failed to verify credit score: ${error.message}`);
    }
  }

  /**
   * Get blockchain network info
   */
  async getNetworkInfo() {
    try {
      const [chainIdentifier, referenceGasPrice] = await Promise.all([
        this.client.getChainIdentifier(),
        this.client.getReferenceGasPrice()
      ]);

      return {
        chainIdentifier,
        referenceGasPrice,
        network: process.env.SUI_NETWORK || 'testnet',
        packageId: this.packageId
      };
    } catch (error) {
      console.error('Error fetching network info:', error);
      throw new Error(`Failed to fetch network info: ${error.message}`);
    }
  }

  /**
   * Get transaction details
   */
  async getTransaction(digest) {
    try {
      const transaction = await this.client.getTransactionBlock({
        digest,
        options: {
          showInput: true,
          showEffects: true,
          showEvents: true,
          showObjectChanges: true,
        },
      });

      return {
        success: true,
        transaction
      };
    } catch (error) {
      console.error('Error fetching transaction:', error);
      throw new Error(`Failed to fetch transaction: ${error.message}`);
    }
  }
}

// Create singleton instance
const blockchainService = new BlockchainService();

module.exports = blockchainService;