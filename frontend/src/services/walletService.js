// Sui Wallet Service
class SuiWalletService {
  constructor() {
    this.wallet = null;
    this.isConnected = false;
    this.account = null;
  }

  // Check if Sui wallet is available
  async checkWalletAvailability() {
    if (typeof window !== 'undefined' && window.suiWallet) {
      this.wallet = window.suiWallet;
      return true;
    }
    return false;
  }

  // Connect to Sui wallet
  async connect() {
    try {
      if (!this.wallet) {
        const isAvailable = await this.checkWalletAvailability();
        if (!isAvailable) {
          throw new Error('Sui wallet not found. Please install a Sui wallet extension.');
        }
      }

      // Request connection
      await this.wallet.requestPermissions();
      
      // Get accounts
      const accounts = await this.wallet.getAccounts();
      if (accounts.length === 0) {
        throw new Error('No accounts found in wallet');
      }

      this.account = accounts[0];
      this.isConnected = true;

      return {
        success: true,
        address: this.account,
        message: 'Wallet connected successfully'
      };
    } catch (error) {
      console.error('Wallet connection error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Disconnect wallet
  async disconnect() {
    try {
      if (this.wallet) {
        await this.wallet.disconnect();
      }
      this.isConnected = false;
      this.account = null;
      
      return {
        success: true,
        message: 'Wallet disconnected successfully'
      };
    } catch (error) {
      console.error('Wallet disconnection error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get wallet balance
  async getBalance() {
    try {
      if (!this.isConnected || !this.account) {
        throw new Error('Wallet not connected');
      }

      // This would typically call the Sui blockchain to get balance
      // For now, return mock data
      return {
        success: true,
        balance: '1000.00',
        currency: 'SUI'
      };
    } catch (error) {
      console.error('Balance check error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Sign message (for authentication)
  async signMessage(message) {
    try {
      if (!this.isConnected || !this.account) {
        throw new Error('Wallet not connected');
      }

      const signature = await this.wallet.signMessage({
        message: new TextEncoder().encode(message)
      });

      return {
        success: true,
        signature,
        message: 'Message signed successfully'
      };
    } catch (error) {
      console.error('Message signing error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Execute transaction (for storing credit score)
  async executeTransaction(transactionData) {
    try {
      if (!this.isConnected || !this.account) {
        throw new Error('Wallet not connected');
      }

      // This would execute a Sui transaction
      // For now, return mock transaction digest
      const mockDigest = '0x' + Math.random().toString(16).substr(2, 64);
      
      return {
        success: true,
        digest: mockDigest,
        message: 'Transaction executed successfully'
      };
    } catch (error) {
      console.error('Transaction execution error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get current connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      account: this.account,
      wallet: this.wallet ? 'Sui Wallet' : null
    };
  }
}

// Create singleton instance
const suiWalletService = new SuiWalletService();

export default suiWalletService;