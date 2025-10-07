const { SuiClient, getFullnodeUrl } = require('@mysten/sui.js/client');
const { TransactionBlock } = require('@mysten/sui.js/transactions');
const { Ed25519Keypair } = require('@mysten/sui.js/keypairs/ed25519');
const { fromB64 } = require('@mysten/sui.js/utils');

class SuiService {
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

  // Store credit score hash on-chain
  async storeCreditScoreHash(userWallet, scoreHash, saccoId) {
    try {
      const tx = new TransactionBlock();
      
      tx.moveCall({
        target: `${this.packageId}::credit_registry::store_credit_record`,
        arguments: [
          tx.pure(Array.from(Buffer.from(scoreHash, 'hex'))),
          tx.pure(Array.from(Buffer.from(saccoId, 'utf8')))
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
        digest: result.digest,
        effects: result.effects
      };
    } catch (error) {
      console.error('Error storing credit score on-chain:', error);
      throw new Error('Failed to store credit score on blockchain');
    }
  }

  // Verify credit score hash on-chain
  async verifyCreditScoreHash(userWallet, expectedHash) {
    try {
      // This would query the blockchain for the user's credit record
      // and verify the hash matches
      const objects = await this.client.getOwnedObjects({
        owner: userWallet,
        options: {
          showContent: true,
        },
      });

      // Look for CreditRecord objects
      const creditRecords = objects.data.filter(obj => 
        obj.data?.type?.includes('CreditRecord')
      );

      for (const record of creditRecords) {
        const content = record.data?.content;
        if (content && content.fields) {
          const onChainHash = Buffer.from(content.fields.score_hash).toString('hex');
          if (onChainHash === expectedHash) {
            return {
              verified: true,
              timestamp: new Date(Number(content.fields.timestamp)),
              saccoId: Buffer.from(content.fields.sacco_id).toString('utf8')
            };
          }
        }
      }

      return { verified: false };
    } catch (error) {
      console.error('Error verifying credit score on-chain:', error);
      throw new Error('Failed to verify credit score on blockchain');
    }
  }

  // Register SACCO on-chain
  async registerSacco(saccoId, saccoName) {
    try {
      const tx = new TransactionBlock();
      
      tx.moveCall({
        target: `${this.packageId}::credit_registry::register_sacco`,
        arguments: [
          tx.pure(Array.from(Buffer.from(saccoId, 'utf8'))),
          tx.pure(Array.from(Buffer.from(saccoName, 'utf8')))
        ],
      });

      const result = await this.client.signAndExecuteTransactionBlock({
        transactionBlock: tx,
        signer: this.keypair,
      });

      return {
        success: true,
        digest: result.digest
      };
    } catch (error) {
      console.error('Error registering SACCO on-chain:', error);
      throw new Error('Failed to register SACCO on blockchain');
    }
  }
}

module.exports = new SuiService();