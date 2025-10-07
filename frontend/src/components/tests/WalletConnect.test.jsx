import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import WalletConnect from '../WalletConnect';
import { AuthProvider } from '../../context/AuthContext';

// Mock the wallet service
vi.mock('../../services/walletService', () => ({
  default: {
    checkWalletAvailability: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
    getConnectionStatus: vi.fn()
  }
}));

import suiWalletService from '../../services/walletService';

const mockUser = {
  id: '1',
  name: 'Test User',
  email: 'test@example.com',
  walletAddress: null
};

const renderWithAuth = (component, user = mockUser) => {
  return render(
    <AuthProvider value={{ user }}>
      {component}
    </AuthProvider>
  );
};

describe('WalletConnect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders connect wallet button when no wallet is connected', () => {
    suiWalletService.checkWalletAvailability.mockResolvedValue(true);
    suiWalletService.getConnectionStatus.mockReturnValue({
      isConnected: false,
      account: null,
      wallet: null
    });

    renderWithAuth(<WalletConnect />);

    expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
  });

  it('shows wallet not available message when no wallet is detected', async () => {
    suiWalletService.checkWalletAvailability.mockResolvedValue(false);

    renderWithAuth(<WalletConnect />);

    await waitFor(() => {
      expect(screen.getByText(/Sui wallet not detected/)).toBeInTheDocument();
    });
  });

  it('connects wallet when connect button is clicked', async () => {
    suiWalletService.checkWalletAvailability.mockResolvedValue(true);
    suiWalletService.connect.mockResolvedValue({
      success: true,
      address: '0x123...',
      message: 'Wallet connected successfully'
    });
    suiWalletService.getConnectionStatus.mockReturnValue({
      isConnected: false,
      account: null,
      wallet: 'Sui Wallet'
    });

    renderWithAuth(<WalletConnect />);

    const connectButton = screen.getByText('Connect Wallet');
    fireEvent.click(connectButton);

    await waitFor(() => {
      expect(suiWalletService.connect).toHaveBeenCalledTimes(1);
    });
  });

  it('shows connected wallet address when wallet is connected', () => {
    const userWithWallet = {
      ...mockUser,
      walletAddress: '0x1234567890abcdef'
    };

    suiWalletService.getConnectionStatus.mockReturnValue({
      isConnected: true,
      account: '0x1234567890abcdef',
      wallet: 'Sui Wallet'
    });

    renderWithAuth(<WalletConnect />, userWithWallet);

    expect(screen.getByText('Connected Wallet')).toBeInTheDocument();
    expect(screen.getByText('0x1234...cdef')).toBeInTheDocument();
  });

  it('disconnects wallet when disconnect button is clicked', async () => {
    const userWithWallet = {
      ...mockUser,
      walletAddress: '0x1234567890abcdef'
    };

    suiWalletService.getConnectionStatus.mockReturnValue({
      isConnected: true,
      account: '0x1234567890abcdef',
      wallet: 'Sui Wallet'
    });
    suiWalletService.disconnect.mockResolvedValue({
      success: true,
      message: 'Wallet disconnected successfully'
    });

    renderWithAuth(<WalletConnect />, userWithWallet);

    const disconnectButton = screen.getByText('Disconnect Wallet');
    fireEvent.click(disconnectButton);

    await waitFor(() => {
      expect(suiWalletService.disconnect).toHaveBeenCalledTimes(1);
    });
  });
});