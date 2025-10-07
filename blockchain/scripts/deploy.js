const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

class SuiDeployer {
  constructor() {
    this.network = process.env.SUI_NETWORK || 'testnet';
    this.packageId = null;
    this.deployedAddresses = {};
  }

  /**
   * Build the Move package
   */
  buildPackage() {
    console.log('🔨 Building Move package...');
    try {
      execSync('sui move build', { 
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')
      });
      console.log('✅ Package built successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to build package:', error);
      return false;
    }
  }

  /**
   * Deploy the package to Sui blockchain
   */
  async deployPackage() {
    console.log('🚀 Deploying package to Sui blockchain...');
    try {
      const output = execSync('sui client publish --gas-budget 1000000000 --json', {
        cwd: path.join(__dirname, '..'),
        encoding: 'utf8'
      });

      const result = JSON.parse(output);
      
      if (result.error) {
        throw new Error(result.error);
      }

      this.packageId = result.objectChanges.find(
        change => change.type === 'published'
      )?.packageId;

      if (!this.packageId) {
        throw new Error('Package ID not found in deployment result');
      }

      console.log(`✅ Package deployed successfully: ${this.packageId}`);
      
      // Extract all object addresses
      this.extractDeployedAddresses(result);
      this.saveDeploymentInfo(result);
      
      return true;
    } catch (error) {
      console.error('❌ Deployment failed:', error);
      return false;
    }
  }

  /**
   * Extract deployed object addresses from deployment result
   */
  extractDeployedAddresses(deploymentResult) {
    const addresses = {};

    deploymentResult.objectChanges.forEach(change => {
      if (change.type === 'created') {
        addresses[change.objectType] = change.objectId;
      }
    });

    this.deployedAddresses = addresses;
    console.log('📦 Deployed objects:', addresses);
  }

  /**
   * Save deployment information to file
   */
  saveDeploymentInfo(deploymentResult) {
    const deploymentInfo = {
      packageId: this.packageId,
      network: this.network,
      deployedAt: new Date().toISOString(),
      objects: this.deployedAddresses,
      transactionDigest: deploymentResult.digest
    };

    const infoPath = path.join(__dirname, '../deployment-info.json');
    fs.writeFileSync(infoPath, JSON.stringify(deploymentInfo, null, 2));
    
    console.log('💾 Deployment info saved to deployment-info.json');
  }

  /**
   * Verify deployment by checking package existence
   */
  async verifyDeployment() {
    if (!this.packageId) {
      console.error('❌ No package ID available for verification');
      return false;
    }

    console.log('🔍 Verifying deployment...');
    try {
      execSync(`sui client object ${this.packageId}`, { stdio: 'inherit' });
      console.log('✅ Deployment verified successfully');
      return true;
    } catch (error) {
      console.error('❌ Deployment verification failed:', error);
      return false;
    }
  }

  /**
   * Run all deployment steps
   */
  async deploy() {
    console.log('🚀 Starting SACCOChain Blockchain Deployment\n');

    // Step 1: Build package
    if (!this.buildPackage()) {
      process.exit(1);
    }

    // Step 2: Deploy package
    if (!await this.deployPackage()) {
      process.exit(1);
    }

    // Step 3: Verify deployment
    if (!await this.verifyDeployment()) {
      process.exit(1);
    }

    console.log('\n🎉 SACCOChain Blockchain Deployment Completed!');
    console.log(`📦 Package ID: ${this.packageId}`);
    console.log(`🌐 Network: ${this.network}`);
    console.log('\n📋 Next steps:`);
    console.log('   1. Update .env file with the new package ID');
    console.log('   2. Restart your backend service');
    console.log('   3. Test blockchain integration');
  }
}

// Run deployment if script is executed directly
if (require.main === module) {
  const deployer = new SuiDeployer();
  deployer.deploy().catch(console.error);
}

module.exports = SuiDeployer;