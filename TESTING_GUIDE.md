# 🧪 SACCOChain End-to-End Testing Guide

## Quick Start

### 1. Run Automated Tests
```bash
cd /home/skywalker/Projects/prj/saccochain
./test-e2e.sh
```

This will verify:
- ✅ All files created correctly
- ✅ All components integrated
- ✅ All routes registered
- ✅ Smart contracts build successfully

---

## 2. Start All Services

```bash
# From the saccochain directory
./start-services.sh
```

This starts:
- **AI Service** on http://localhost:5001
- **Backend** on http://localhost:3000
- **Frontend** on http://localhost:5173

---

## 3. Manual Feature Testing

### 🌐 Test 1: Multilingual Landing Page

1. **Open browser**: http://localhost:5173
2. **Check default language** (English)
3. **Click language toggle** (EN → SW)
4. **Verify translations**: Hero title should change to Swahili
5. **Test newsletter**: Enter email, click subscribe
6. **Expected**: Success message appears

**Pass Criteria**:
- ✅ Language switches instantly
- ✅ All text translates
- ✅ Newsletter submission works

---

### 🌓 Test 2: Dark Mode

1. **Find dark mode toggle** (Moon/Sun icon in navbar)
2. **Click to switch** to dark mode
3. **Verify**: Background turns dark, text becomes light
4. **Refresh page**
5. **Expected**: Dark mode persists (LocalStorage)
6. **Switch back** to light mode

**Pass Criteria**:
- ✅ Theme toggles smoothly
- ✅ All colors adapt
- ✅ Preference persists across page loads

---

### 💬 Test 3: Chatbot Widget

1. **Look for floating button** (bottom-right, 💬 icon)  
2. **Click to open** chatbot
3. **Type**: "How do I register?"
4. **Expected**: Bot responds with registration instructions
5. **Try more keywords**:
   - "blockchain" → Sui explanation
   - "cost" → Pricing information
   - "habari" (Swahili) → Greeting
6. **Switch to Swahili language** → Chatbot responds in Swahili

**Pass Criteria**:
- ✅ Widget opens/closes smoothly
- ✅ Keyword responses work
- ✅ Supports both languages

---

### 🔍 Test 4: Inter-SACCO Verification (KEY FEATURE)

#### A. Create Test Data First

**Option 1**: Use existing database user  
**Option 2**: Register new test user

1. **Go to** http://localhost:5173/register
2. **Fill in**:
   - Name: John Kamau
   - Email: john@test.com
   - National ID: 12345678
   - Password: test123
3. **Click** "Create account"
4. **Login** with credentials

#### B. Test Verification

1. **Logout** and login as **admin** (or use admin credentials if you have)
   - Default admin might be in seed data
   
2. **Navigate to** http://localhost:5173/verify

3. **Test Search by User ID**:
   - Select "User ID" from dropdown
   - Enter the user ID (check in database or admin panel)
   - Click "Verify Member"

4. **Expected Results**:
   ```
   ✅ User Found: John Kamau
   📊 Credit Score: 720 (example)
   🎯 Risk Level: LOW
   💰 Financial Summary:
      - Total Deposits: KES 0
      - Total Loans: KES 0
      - Outstanding: KES 0
      - Repayment Rate: 100%
   🔗 Inter-SACCO Activity:
      - Active in 1 SACCO
      - Has Borrowings: No
   ```

5. **Test Search by National ID**:
   - Change dropdown to "National ID"
   - Enter: 12345678
   - Click "Verify Member"
   - Should show same results

6. **Test Error Handling**:
   - Enter invalid ID: "999999"
   - Should show error message

**Pass Criteria**:
- ✅ Search works for all 3 types (User ID, Wallet, National ID)
- ✅ Results display correctly
- ✅ All sections render (Credit Profile, Financial Summary, Inter-SACCO Activity)
- ✅ Progress bars animate
- ✅ Error handling works
- ✅ Dark mode works on this page

---

### 🤖 Test 5: AI Credit Scoring

1. **As logged-in member**, go to dashboard
2. **Find "Calculate Credit Score" button**
3. **Click it**
4. **Expected**: API calls AI service at http://localhost:5001
5. **Result**: Credit score calculated and displayed
6. **Check**: Score should be between 300-850

**API Test** (Optional - in terminal):
```bash
curl -X POST http://localhost:5001/score \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test123",
    "savings_consistency": 75,
    "loan_to_deposit_ratio": 0.3,
    "transaction_frequency": 8,
    "previous_loans_repaid": 3
  }'
```

**Expected Response**:
```json
{
  "user_id": "test123",
  "credit_score": 720,
  "risk_level": "LOW",
  "timestamp": "2026-01-27T20:35:00Z"
}
```

**Pass Criteria**:
- ✅ AI service responds
- ✅ Score is calculated
- ✅ Risk level is determined
- ✅ Response time < 1 second

---

## 4. Backend API Testing

### Test Verification Endpoint

```bash
# First, get a JWT token by logging in
TOKEN="your-jwt-token-here"

# Test member verification
curl -X GET http://localhost:3000/api/verification/member/USER_ID \
  -H "Authorization: Bearer $TOKEN"
```

**Expected**: Full member profile JSON

### Test Newsletter Endpoint

```bash
curl -X POST http://localhost:3000/api/newsletter/subscribe \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

**Expected**: `{"message": "Subscribed successfully"}`

---

## 5. Smart Contract Testing

### Build Contracts
```bash
cd /home/skywalker/Projects/prj/saccochain/blockchain
sui move build
```

**Expected**: 
```
BUILDING saccochain
Successfully built module sacco_registry
Successfully built module credit_registry
Successfully built module credit_oracle
```

### Deploy to Testnet (Optional - requires testnet SUI)
```bash
sui client publish --gas-budget 100000000
```

**Note**: This requires:
- Sui wallet configured
- Testnet SUI tokens (get from faucet)

**Save the Package ID** from deployment output and update:
- `backend/.env` → `SUI_PACKAGE_ID=<package-id>`
- `frontend/.env` → `VITE_SUI_PACKAGE_ID=<package-id>`

---

## 6. Performance Testing

### Load Test AI Service
```bash
# Run 100 requests
for i in {1..100}; do
  curl -s -X POST http://localhost:5001/score \
    -H "Content-Type: application/json" \
    -d '{"user_id": "test'$i'", "savings_consistency": 70, "loan_to_deposit_ratio": 0.4, "transaction_frequency": 5, "previous_loans_repaid": 2}' &
done
wait
```

**Expected**: All requests complete successfully in < 10 seconds

### Test Verification Speed
```bash
time curl -X GET http://localhost:3000/api/verification/member/USER_ID \
  -H "Authorization: Bearer $TOKEN"
```

**Expected**: Response time < 2 seconds

---

## 7. Browser Compatibility Testing

Test in multiple browsers:
- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari (if on Mac)
- [ ] Edge

**Check**:
- Dark mode works
- Chatbot opens
- Language switch works
- Responsive design (resize window)

---

## 8. Mobile Responsiveness

1. **Open browser dev tools** (F12)
2. **Toggle device toolbar** (Ctrl+Shift+M)
3. **Select mobile device** (iPhone, Android)
4. **Test all features**:
   - Landing page scrolls smoothly
   - Chatbot widget is accessible
   - Verification dashboard is readable
   - Forms are usable

**Pass Criteria**:
- ✅ No horizontal scroll
- ✅ All buttons are clickable
- ✅ Text is readable
- ✅ Images scale properly

---

## 9. Security Testing

### Test Authentication
```bash
# Try accessing protected route without token
curl -X GET http://localhost:3000/api/verification/member/test123

# Expected: 401 Unauthorized
```

### Test Admin Protection
1. **Login as regular member**
2. **Try to access** http://localhost:5173/verify
3. **Expected**: Redirect to dashboard (403 Forbidden)

### Test CORS
```bash
# From different origin
curl -X POST http://localhost:3000/api/newsletter/subscribe \
  -H "Origin: http://malicious-site.com" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@test.com"}'

# Check if CORS headers are present
```

---

## 10. Stop Services

```bash
./stop-services.sh
```

Or manually:
```bash
# Find and kill processes
pkill -f "npm run dev"
pkill -f "python app.py"
```

---

## ✅ Testing Checklist

### Feature Completeness
- [ ] Multilingual (EN/SW) working
- [ ] Dark mode working
- [ ] Chatbot responding
- [ ] Newsletter subscription working
- [ ] Member verification working (all 3 search types)
- [ ] Credit score calculation working
- [ ] Inter-SACCO activity displaying
- [ ] Smart contracts building

### Integration
- [ ] Frontend connects to backend
- [ ] Backend connects to AI service
- [ ] Backend connects to database
- [ ] Smart contracts ready for deployment

### User Experience
- [ ] Landing page loads fast (< 2s)
- [ ] Language switch is instant
- [ ] Dark mode toggle is smooth
- [ ] Chatbot is intuitive
- [ ] Verification results are clear
- [ ] Error messages are helpful

### Performance
- [ ] API responses < 2s
- [ ] AI scoring < 1s
- [ ] Page load < 3s
- [ ] No console errors

### Security
- [ ] Authentication required for protected routes
- [ ] Admin-only routes protected
- [ ] CORS configured
- [ ] Input validation working

---

## 📊 Success Criteria

**Minimum Viable Demo**: 80% of tests passing  
**Hackathon Ready**: 90% of tests passing  
**Production Ready**: 95% of tests passing

---

## 🐛 Troubleshooting

### Services Won't Start

**Backend Error: "Cannot connect to database"**
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Start PostgreSQL
sudo systemctl start postgresql

# Update .env with correct DATABASE_URL
```

**Frontend Error: "node_modules not found"**
```bash
cd frontend
npm install
```

**AI Service Error: "Module not found"**
```bash
cd ai-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Port Already in Use
```bash
# Find what's using the port
lsof -i:3000  # or 5173, or 5001

# Kill the process
kill -9 <PID>
```

### Smart Contract Build Fails
```bash
# Check Sui CLI version
sui --version

# Update if needed
cargo install --locked --git https://github.com/MystenLabs/sui.git --branch mainnet sui
```

---

## 📝 Test Report Template

After testing, fill this out:

```
# Test Report - SACCOChain

Date: _______________
Tester: _______________

## Features Tested
- [ ] Multilingual Support (EN/SW)
- [ ] Dark Mode
- [ ] Chatbot Widget
- [ ] Inter-SACCO Verification
- [ ] AI Credit Scoring
- [ ] Smart Contracts Build

## Results
Tests Passed: ___/___
Tests Failed: ___/___
Success Rate: ___%

## Issues Found
1. 
2. 
3. 

## Recommendations
1. 
2. 
3. 

## Overall Status
[ ] Ready for Demo
[ ] Needs Minor Fixes
[ ] Needs Major Work
```

---

**Happy Testing! 🧪🚀**

For questions or issues, check:
- `/TEST_RESULTS.md` - Automated test results
- `/FINAL_SUMMARY.md` - Complete feature summary
- `/DEPLOYMENT_GUIDE.md` - Smart contract deployment
- `/AI_TRAINING_GUIDE.md` - AI service setup
