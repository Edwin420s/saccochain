# SACCOChain - Hybrid Blockchain Credit Platform

A full-stack platform for SACCOs that combines blockchain transparency with AI-powered credit scoring.

##  Features

- **Hybrid Architecture**: On-chain verification + Off-chain processing
- **AI Credit Scoring**: Machine learning models for risk assessment
- **Blockchain Integration**: Sui blockchain for immutable records
- **Multi-language**: English & Swahili support
- **Real-time Dashboard**: Live credit score monitoring
- **Secure Authentication**: JWT-based user management

## 🛠 Tech Stack

### Frontend
- React 18 + Vite
- TailwindCSS + DaisyUI
- Sui.js SDK
- React i18next

### Backend
- Node.js + Express
- PostgreSQL + Prisma
- JWT Authentication
- Redis Caching

### Blockchain
- Sui Move Smart Contracts
- Sui Testnet/Mainnet

### AI Service
- Python + Flask
- Scikit-learn Models
- REST API

##  Installation

1. **Clone Repository**
```bash
git clone https://github.com/your-org/saccochain
cd saccochain
```
## Start with Docker
```
docker-compose up -d
```
## Manual Setup
```
# Backend
cd backend
npm install
cp .env.example .env
npx prisma migrate dev
npm run dev

# Frontend
cd frontend
npm install
npm run dev

# AI Service
cd ai-service
pip install -r requirements.txt
python app.py
```
## Configuration

Set up environment variables in backend/.env

Deploy smart contracts to Sui blockchain

Train and save AI model in ai-service/model/

Configure database connection

##  Usage

SACCO Registration: SACCOs register on the platform

Member Onboarding: Members join with wallet connection

Credit Scoring: AI analyzes financial behavior

Loan Processing: Smart contract-based approvals

Verification: On-chain record verification

## Security 

JWT token authentication

Password hashing with bcrypt

Rate limiting on APIs

CORS protection

Helmet security headers

Blockchain-based data integrity

## License
MIT License - see LICENSE file for details

```

This complete full-stack implementation provides:

1. **Frontend**: Modern React app with internationalization and dark mode
2. **Backend**: Secure Node.js API with PostgreSQL database
3. **Blockchain**: Sui smart contracts for credit verification
4. **AI Service**: Python Flask service for credit scoring
5. **Database**: Prisma ORM with complete schema
6. **Deployment**: Docker configuration for easy deployment
7. **Documentation**: Comprehensive setup and usage guide

All components are well-documented, secure, and ready for development and deployment. The system handles user authentication, credit scoring, blockchain verification, and provides a complete dashboard for SACCO management.
```
