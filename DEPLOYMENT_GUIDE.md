# Smart Contract Deployment Instructions

## Prerequisites
1. Install Sui CLI:
```bash
cargo install --locked --git https://github.com/MystenLabs/sui.git --branch mainnet sui
```

2. Set up Sui wallet:
```bash
sui client
# Follow prompts to create wallet or import mnemonic
```

3. Get testnet SUI tokens:
- Visit: https://discord.gg/sui
- Use #testnet-faucet channel
- Or use: `sui client faucet`

## Deploy Smart Contracts

### Step 1: Build Contracts
```bash
cd /home/skywalker/Projects/prj/saccochain/blockchain
sui move build
```

**Expected Output**:
```
BUILDING saccochain
Successfully built module sacco_registry
Successfully built module credit_registry  
Successfully built module credit_oracle
```

### Step 2: Test Contracts (Optional)
```bash
sui move test
```

### Step 3: Deploy to Testnet
```bash
sui client publish --gas-budget 100000000
```

**What This Does**:
- Publishes all modules to Sui testnet
- Returns a Package ID (critical - save this!)
- Creates on-chain module instances

**Expected Output**:
```
----- Transaction Digest ----
<transaction_hash>

----- Publish Results ----
Created Objects:
  - ID: <PACKAGE_ID>
    Owner: Immutable
    Module: sacco_registry, credit_registry, credit_oracle

Gas Object:
  - gas payment: <amount> MIST
```

### Step 4: Save Package ID
Copy the `PACKAGE_ID` from output above.

Update backend `.env`:
```bash
# In /home/skywalker/Projects/prj/saccochain/backend/.env
SUI_PACKAGE_ID=<PASTE_PACKAGE_ID_HERE>
```

Update frontend `.env`:
```bash
# In /home/skywalker/Projects/prj/saccochain/frontend/.env
VITE_SUI_PACKAGE_ID=<PASTE_PACKAGE_ID_HERE>
```

## Verify Deployment

### Test Contract Interaction
```bash
sui client call --function register_sacco \
  --module sacco_registry \
  --package <PACKAGE_ID> \
  --args "TestSACCO" "LICENSE123" \
  --gas-budget 10000000
```

**Success Indicator**:
- Transaction succeeds
- Returns object ID for created SACCO

### View On-Chain Data
```bash
# View deployed package
sui client object <PACKAGE_ID>

# View created SACCO
sui client object <SACCO_OBJECT_ID>
```

### Explore on Sui Explorer
Visit: `https://suiexplorer.com/object/<PACKAGE_ID>?network=testnet`

## Post-Deployment Tasks

1. **Update Documentation**
   - Add package ID to README.md
   - Document deployed contract addresses

2. **Test Backend Integration**
```bash
cd /home/skywalker/Projects/prj/saccochain/backend
npm run test:sui
```

3. **Test Frontend Integration**
   - Navigate to app
   - Connect Sui wallet
   - Verify blockchain interactions work

## Troubleshooting

### Error: "Insufficient gas"
**Solution**: Get more testnet SUI from faucet
```bash
sui client faucet
```

### Error: "Module already exists"
**Solution**: Use `--upgrade-capability` flag or deploy with new address:
```bash
sui client publish --gas-budget 100000000 --skip-dependency-verification
```

### Error: "Build failed"
**Solution**: Check Move.toml dependencies
```bash
cat Move.toml
# Ensure sui = "1.0.0" or latest
```

## Manual Deployment (Alternative)

If automated deployment fails, use Sui Studio:
1. Visit https://sui-playground.dev
2. Paste contract code
3. Click "Deploy"
4. Copy generated package ID

## Environment Variables Reference

```bash
# Backend .env
SUI_NETWORK=testnet
SUI_PACKAGE_ID=<from_deployment>
SUI_ADMIN_CAP=<if_using_admin_capabilities>

# Frontend .env
VITE_SUI_NETWORK=testnet
VITE_SUI_PACKAGE_ID=<from_deployment>
VITE_SUI_RPC_URL=https://fullnode.testnet.sui.io:443
```

## Next Steps After Deployment

1. ✅ Smart contracts deployed to testnet
2. ✅ Package ID saved in .env files
3. ➡️ Test contract calls from backend
4. ➡️ Test UI wallet interactions
5. ➡️ Train AI model
6. ➡️ Run end-to-end tests
7. ➡️ Record demo video

---

**Status**: Contracts built ✅  
**Next**: Deploy to testnet ⏳  
**Estimated Time**: 10 minutes
