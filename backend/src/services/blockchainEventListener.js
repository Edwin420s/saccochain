const { SuiClient, getFullnodeUrl } = require('@mysten/sui.js/client');
const { PrismaClient } = require('@prisma/client');
const blockchainService = require('./blockchainService');

class BlockchainEventListener {
  constructor() {
    this.client = new SuiClient({ 
      url: getFullnodeUrl(process.env.SUI_NETWORK || 'testnet') 
    });
    this.prisma = new PrismaClient();
    this.isListening = false;
    this.lastProcessedTx = null;
  }

  /**
   * Start listening to blockchain events
   */
  async startListening() {
    if (this.isListening) {
      console.log('⚠️  Event listener is already running');
      return;
    }

    console.log('🔊 Starting blockchain event listener...');
    this.isListening = true;

    try {
      await this.processPastEvents();
      this.startEventPolling();
    } catch (error) {
      console.error('❌ Failed to start event listener:', error);
      this.isListening = false;
    }
  }

  /**
   * Process past events since last processed transaction
   */
  async processPastEvents() {
    try {
      // Get recent transactions for our package
      const transactions = await this.client.queryTransactionBlocks({
        filter: {
          MoveFunction: {
            package: blockchainService.packageId
          }
        },
        order: 'Ascending',
        limit: 50
      });

      for (const tx of transactions.data) {
        if (this.lastProcessedTx && tx.digest === this.lastProcessedTx) {
          continue;
        }

        await this.processTransaction(tx.digest);
        this.lastProcessedTx = tx.digest;
      }

      console.log(`✅ Processed ${transactions.data.length} past transactions`);
    } catch (error) {
      console.error('Error processing past events:', error);
    }
  }

  /**
   * Start polling for new events
   */
  startEventPolling() {
    this.pollInterval = setInterval(async () => {
      try {
        await this.checkNewEvents();
      } catch (error) {
        console.error('Error in event polling:', error);
      }
    }, 10000); // Check every 10 seconds

    console.log('🔄 Started event polling');
  }

  /**
   * Check for new events
   */
  async checkNewEvents() {
    try {
      const transactions = await this.client.queryTransactionBlocks({
        filter: {
          MoveFunction: {
            package: blockchainService.packageId
          }
        },
        order: 'Descending',
        limit: 10
      });

      for (const tx of transactions.data) {
        if (tx.digest === this.lastProcessedTx) {
          break;
        }

        await this.processTransaction(tx.digest);
        this.lastProcessedTx = tx.digest;
      }
    } catch (error) {
      console.error('Error checking new events:', error);
    }
  }

  /**
   * Process a transaction and its events
   */
  async processTransaction(digest) {
    try {
      const tx = await this.client.getTransactionBlock({
        digest,
        options: {
          showEvents: true,
          showObjectChanges: true
        }
      });

      if (tx.events && tx.events.length > 0) {
        for (const event of tx.events) {
          await this.handleEvent(event, digest);
        }
      }

      console.log(`✅ Processed transaction: ${digest}`);
    } catch (error) {
      console.error(`Error processing transaction ${digest}:`, error);
    }
  }

  /**
   * Handle specific blockchain events
   */
  async handleEvent(event, transactionDigest) {
    const eventType = event.type;
    const eventData = event.parsedJson;

    try {
      switch (eventType) {
        case `${blockchainService.packageId}::sacco_registry::CreditScoreStored`:
          await this.handleCreditScoreStored(eventData, transactionDigest);
          break;

        case `${blockchainService.packageId}::sacco_registry::LoanAgreementCreated`:
          await this.handleLoanAgreementCreated(eventData, transactionDigest);
          break;

        case `${blockchainService.packageId}::sacco_registry::SaccoRegistered`:
          await this.handleSaccoRegistered(eventData, transactionDigest);
          break;

        case `${blockchainService.packageId}::sacco_registry::MemberRegistered`:
          await this.handleMemberRegistered(eventData, transactionDigest);
          break;

        default:
          console.log(`ℹ️  Unhandled event type: ${eventType}`);
      }
    } catch (error) {
      console.error(`Error handling event ${eventType}:`, error);
    }
  }

  /**
   * Handle credit score stored event
   */
  async handleCreditScoreStored(eventData, transactionDigest) {
    console.log('📊 Credit score stored event:', eventData);

    try {
      // Update user's credit score in database
      const user = await this.prisma.user.findFirst({
        where: {
          walletAddress: eventData.member_address
        }
      });

      if (user) {
        await this.prisma.creditScore.updateMany({
          where: {
            userId: user.id,
            onChainHash: null
          },
          data: {
            onChainHash: 'pending_verification', // Will be updated with actual hash
            updatedAt: new Date()
          }
        });

        console.log(`✅ Updated credit score for user: ${user.email}`);
      }
    } catch (error) {
      console.error('Error handling credit score event:', error);
    }
  }

  /**
   * Handle loan agreement created event
   */
  async handleLoanAgreementCreated(eventData, transactionDigest) {
    console.log('📝 Loan agreement created event:', eventData);

    try {
      // Update loan application in database
      // This would typically match the loan application with the blockchain record
      console.log(`ℹ️  Loan agreement created for member: ${eventData.member_address}`);
    } catch (error) {
      console.error('Error handling loan agreement event:', error);
    }
  }

  /**
   * Handle SACCO registered event
   */
  async handleSaccoRegistered(eventData, transactionDigest) {
    console.log('🏦 SACCO registered event:', eventData);

    try {
      // Update SACCO record in database
      const sacco = await this.prisma.sacco.findFirst({
        where: {
          licenseNo: eventData.sacco_id
        }
      });

      if (sacco) {
        await this.prisma.sacco.update({
          where: { id: sacco.id },
          data: {
            blockchainRegistered: true,
            blockchainTxHash: transactionDigest,
            updatedAt: new Date()
          }
        });

        console.log(`✅ Updated SACCO registration: ${sacco.name}`);
      }
    } catch (error) {
      console.error('Error handling SACCO registration event:', error);
    }
  }

  /**
   * Handle member registered event
   */
  async handleMemberRegistered(eventData, transactionDigest) {
    console.log('👤 Member registered event:', eventData);

    try {
      // Update user record in database
      const user = await this.prisma.user.findFirst({
        where: {
          walletAddress: eventData.member_address,
          nationalId: eventData.national_id
        }
      });

      if (user) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            blockchainRegistered: true,
            blockchainTxHash: transactionDigest,
            updatedAt: new Date()
          }
        });

        console.log(`✅ Updated member registration: ${user.email}`);
      }
    } catch (error) {
      console.error('Error handling member registration event:', error);
    }
  }

  /**
   * Stop listening to events
   */
  stopListening() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    
    this.isListening = false;
    console.log('🛑 Stopped blockchain event listener');
  }

  /**
   * Get listener status
   */
  getStatus() {
    return {
      isListening: this.isListening,
      lastProcessedTx: this.lastProcessedTx,
      packageId: blockchainService.packageId,
      network: process.env.SUI_NETWORK || 'testnet'
    };
  }
}

// Create singleton instance
const blockchainEventListener = new BlockchainEventListener();

module.exports = blockchainEventListener;