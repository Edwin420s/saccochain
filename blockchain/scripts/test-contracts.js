const { SuiClient, getFullnodeUrl } = require('@mysten/sui.js/client');
const { TransactionBlock } = require('@mysten/sui.js/transactions');
const { Ed25519Keypair } = require('@mysten/sui.js/keypairs/ed25519');
const { fromB64 } = require('@mysten/sui.js/utils');
require('dotenv').config();

class ContractTester {
  constructor() {
    this.client = new SuiClient({ url: getFullnodeUrl('testnet') });
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
   * Test SACCO registration
   */
  async testSaccoRegistration() {
    console.log('🧪 Testing SACCO registration...');
    
    const tx = new TransactionBlock();
    
    const saccoId = 'SACCO_TEST_001';
    const saccoName = 'Test SACCO';
    const licenseNumber = 'LICENSE_001';

    tx.moveCall({
      target: `${this.packageId}::sacco_registry::register_sacco`,
      arguments: [
        tx.pure(Array.from(Buffer.from(saccoId, 'utf8'))),
        tx.pure(Array.from(Buffer.from(saccoName, 'utf8'))),
        tx.pure(Array.from(Buffer.from(licenseNumber, 'utf8')))
      ],
    });

    try {
      const result = await this.client.signAndExecuteTransactionBlock({
        transactionBlock: tx,
        signer: this.keypair,
        options: {
          showEffects: true,
          showObjectChanges: true,
        },
      });

      console.log('✅ SACCO registration test passed');
      console.log(`   Transaction: ${result.digest}`);
      return result;
    } catch (error) {
      console.error('❌ SACCO registration test failed:', error);
      throw error;
    }
  }

  /**
   * Test credit score storage
   */
  async testCreditScoreStorage() {
    console.log('🧪 Testing credit score storage...');
    
    const tx = new TransactionBlock();
    
    const saccoId = 'SACCO_TEST_001';
    const creditScore = 750;
    const riskLevel = 'LOW';
    const scoreHash = Array.from(Buffer.from('test_hash_123456', 'utf8'));

    tx.moveCall({
      target: `${this.packageId}::sacco_registry::store_credit_score`,
      arguments: [
        tx.pure(Array.from(Buffer.from(saccoId, 'utf8'))),
        tx.pure(creditScore),
        tx.pure(Array.from(Buffer.from(riskLevel, 'utf8'))),
        tx.pure(scoreHash)
      ],
    });

    try {
      const result = await this.client.signAndExecuteTransactionBlock({
        transactionBlock: tx,
        signer: this.keypair,
        options: {
          showEffects: true,
          showObjectChanges: true,
        },
      });

      console.log('✅ Credit score storage test passed');
      console.log(`   Transaction: ${result.digest}`);
      return result;
    } catch (error) {
      console.error('❌ Credit score storage test failed:', error);
      throw error;
    }
  }

  /**
   * Test loan agreement creation
   */
  async testLoanAgreement() {
    console.log('🧪 Testing loan agreement creation...');
    
    const tx = new TransactionBlock();
    
    const saccoId = 'SACCO_TEST_001';
    const loanAmount = 5000000; // 5000 KSH in smallest units
    const interestRate = 1200; // 12% in basis points
    const durationMonths = 12;
    const agreementHash = Array.from(Buffer.from('agreement_hash_789012', 'utf8'));

    tx.moveCall({
      target: `${this.packageId}::sacco_registry::create_loan_agreement`,
      arguments: [
        tx.pure(Array.from(Buffer.from(saccoId, 'utf8'))),
        tx.pure(loanAmount),
        tx.pure(interestRate),
        tx.pure(durationMonths),
        tx.pure(agreementHash)
      ],
    });

    try {
      const result = await this.client.signAndExecuteTransactionBlock({
        transactionBlock: tx,
        signer: this.keypair,
        options: {
          showEffects: true,
          showObjectChanges: true,
        },
      });

      console.log('✅ Loan agreement test passed');
      console.log(`   Transaction: ${result.digest}`);
      return result;
    } catch (error) {
      console.error('❌ Loan agreement test failed:', error);
      throw error;
    }
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    console.log('🚀 Starting SACCOChain Contract Tests\n');
    
    try {
      await this.testSaccoRegistration();
      await this.testCreditScoreStorage();
      await this.testLoanAgreement();
      
      console.log('\n🎉 All contract tests passed!');
      console.log('📋 The smart contracts are working correctly.');
    } catch (error) {
      console.error('\n💥 Some tests failed. Please check the errors above.');
      process.exit(1);
    }
  }
}

// Run tests if script is executed directly
if (require.main === module) {
  const tester = new ContractTester();
  tester.runAllTests().catch(console.error);
}

module.exports = ContractTester;