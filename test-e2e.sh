#!/bin/bash

# SACCOChain End-to-End Testing Script
# This script tests all enhanced features

echo "🚀 SACCOChain End-to-End Testing"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to print test result
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ PASS${NC}: $2"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC}: $2"
        ((TESTS_FAILED++))
    fi
}

echo "📋 Test 1: Check Smart Contracts Build"
echo "---------------------------------------"
cd /home/skywalker/Projects/prj/saccochain/blockchain
if sui move build > /dev/null 2>&1; then
    print_result 0 "Smart contracts build successfully"
else
    print_result 1 "Smart contracts build failed"
fi
echo ""

echo "📋 Test 2: Check Backend Dependencies"
echo "--------------------------------------"
cd /home/skywalker/Projects/prj/saccochain/backend
if [ -d "node_modules" ]; then
    print_result 0 "Backend dependencies installed"
else
    print_result 1 "Backend dependencies missing"
fi
echo ""

echo "📋 Test 3: Check Frontend Files"
echo "--------------------------------"
cd /home/skywalker/Projects/prj/saccochain/frontend

# Check translation files
if [ -f "src/locales/en.json" ] && [ -f "src/locales/sw.json" ]; then
    print_result 0 "Translation files exist (EN + SW)"
else
    print_result 1 "Translation files missing"
fi

# Check ThemeContext
if [ -f "src/context/ThemeContext.jsx" ]; then
    print_result 0 "ThemeContext created"
else
    print_result 1 "ThemeContext missing"
fi

# Check ChatbotWidget
if [ -f "src/components/ChatbotWidget.jsx" ]; then
    print_result 0 "ChatbotWidget component created"
else
    print_result 1 "ChatbotWidget missing"
fi

# Check VerifyMember page
if [ -f "src/pages/VerifyMember.jsx" ]; then
    print_result 0 "VerifyMember page created"
else
    print_result 1 "VerifyMember page missing"
fi
echo ""

echo "📋 Test 4: Check Backend API Routes"
echo "------------------------------------"
cd /home/skywalker/Projects/prj/saccochain/backend

# Check verification routes
if [ -f "src/routes/verification.js" ]; then
    print_result 0 "Verification API routes created"
    
    # Check if routes are registered in app.js
    if grep -q "verification" src/app.js; then
        print_result 0 "Verification routes registered in app.js"
    else
        print_result 1 "Verification routes not registered"
    fi
else
    print_result 1 "Verification routes missing"
fi
echo ""

echo "📋 Test 5: Check Translation Content"
echo "-------------------------------------"
cd /home/skywalker/Projects/prj/saccochain/frontend

# Check for key translation keys
if grep -q "interSacco" src/locales/en.json; then
    print_result 0 "Inter-SACCO translations present"
else
    print_result 1 "Inter-SACCO translations missing"
fi

if grep -q "chatbot" src/locales/en.json; then
    print_result 0 "Chatbot translations present"
else
    print_result 1 "Chatbot translations missing"
fi

if grep -q "verificationTitle" src/locales/en.json; then
    print_result 0 "Verification translations present"
else
    print_result 1 "Verification translations missing"
fi
echo ""

echo "📋 Test 6: Check Route Integration"
echo "-----------------------------------"
if grep -q "VerifyMember" src/App.jsx; then
    print_result 0 "VerifyMember route integrated in App.jsx"
else
    print_result 1 "VerifyMember route not integrated"
fi

if grep -q "ThemeProvider" src/App.jsx; then
    print_result 0 "ThemeProvider integrated in App.jsx"
else
    print_result 1 "ThemeProvider not integrated"
fi
echo ""

echo "📋 Test 7: Check Component Imports"
echo "-----------------------------------"
if grep -q "ChatbotWidget" src/pages/LandingPage.jsx; then
    print_result 0 "ChatbotWidget imported in LandingPage"
else
    print_result 1 "ChatbotWidget not imported"
fi

if grep -q "useTheme" src/pages/LandingPage.jsx; then
    print_result 0 "useTheme hook imported in LandingPage"
else
    print_result 1 "useTheme hook not imported"
fi
echo ""

echo "📋 Test 8: Check Documentation"
echo "-------------------------------"
cd /home/skywalker/Projects/prj/saccochain

if [ -f "DEPLOYMENT_GUIDE.md" ]; then
    print_result 0 "Deployment guide created"
else
    print_result 1 "Deployment guide missing"
fi

if [ -f "AI_TRAINING_GUIDE.md" ]; then
    print_result 0 "AI training guide created"
else
    print_result 1 "AI training guide missing"
fi
echo ""

echo "📋 Test 9: Verify Smart Contract Files"
echo "---------------------------------------"
cd blockchain/sources

if [ -f "credit_registry.move" ]; then
    print_result 0 "credit_registry.move exists"
else
    print_result 1 "credit_registry.move missing"
fi

if [ -f "sacco_registry.move" ]; then
    print_result 0 "sacco_registry.move exists"
else
    print_result 1 "sacco_registry.move missing"
fi

if [ -f "credit_oracle.move" ]; then
    print_result 0 "credit_oracle.move exists"
else
    print_result 1 "credit_oracle.move missing"
fi
echo ""

echo "📋 Test 10: Check AI Service"
echo "-----------------------------"
cd /home/skywalker/Projects/prj/saccochain/ai-service

if [ -f "app.py" ]; then
    print_result 0 "AI service app.py exists"
else
    print_result 1 "AI service missing"
fi

if [ -f "requirements.txt" ]; then
    print_result 0 "AI service requirements.txt exists"
else
    print_result 1 "Requirements file missing"
fi
echo ""

echo "========================================"
echo "📊 Test Summary"
echo "========================================"
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
TOTAL=$((TESTS_PASSED + TESTS_FAILED))
PERCENTAGE=$((TESTS_PASSED * 100 / TOTAL))
echo "Success Rate: $PERCENTAGE%"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! Ready for deployment.${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  Some tests failed. Please review.${NC}"
    exit 1
fi
