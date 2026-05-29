# AI-Driven FDP Ecosystem with Blockchain Certification & Analytics

A production-ready Faculty Development Program (FDP) platform powered by AI and blockchain technology.

## 🏗️ Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Frontend   │────▶│   Backend    │────▶│  AI Service  │
│  React+Vite  │     │ Spring Boot  │     │   FastAPI    │
└──────┬──────┘     └──────┬───────┘     └─────────────┘
       │                    │
       │              ┌─────┴─────┐
       │              │  Database  │
       │              │  H2/MySQL  │
       │              └───────────┘
       │
┌──────┴──────┐
│  Blockchain  │
│  Ethereum    │
│  (MetaMask)  │
└─────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Java 17+ & Maven 3.9+
- Node.js 20+
- Python 3.11+

### 1. Start the Backend
```bash
cd backend
mvn spring-boot:run
```
Backend runs at http://localhost:8080

### 2. Start the AI Service (Optional)
```bash
cd ai-service
pip install -r requirements.txt
python main.py
```
AI Service runs at http://localhost:8000

### 3. Start the Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at http://localhost:5173

### 4. Start Blockchain (Optional)
```bash
cd blockchain
npm install
npx hardhat node           # Start local node
npx hardhat run scripts/deploy.js --network localhost
```

## 📋 Bootstrap Admin Account

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@fdphub.com | admin123 |

> **Note:** This account is only created on first startup when the database is empty. Additional admin and faculty accounts should be registered through the platform UI (`/admin/register` or `/register`).

## 🧩 Core Modules

1. **Authentication** - JWT-based login/register with BCrypt password hashing
2. **FDP Management** - Create, manage, and track faculty development programs
3. **AI Learning** - AI-generated content, quizzes, and personalized recommendations
4. **AI Evaluation** - Automated quiz scoring with AI feedback
5. **Blockchain Certificates** - Tamper-proof certificate issuance on Ethereum
6. **Analytics Dashboard** - Real-time metrics from database

## 🐳 Docker

```bash
docker-compose up -d
```

## 📡 API Endpoints

| Service | Base URL | Description |
|---------|----------|-------------|
| Auth | `/api/auth/*` | Login, Register |
| FDP | `/api/fdp/*` | CRUD + AI Generation |
| Enrollments | `/api/enrollments/*` | Enroll, Track, Submit Quiz |
| AI | `/api/ai/*` | Content, Quiz, Evaluation |
| Certificates | `/api/certificate/*` | Issue, Verify |
| Analytics | `/api/analytics/*` | Admin & Faculty metrics |

## 🔐 Security

- JWT authentication with HMAC-SHA256
- BCrypt password hashing
- CORS configuration
- Input validation with Jakarta Bean Validation
- Environment-based secrets

## ⚙️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite 8 + TailwindCSS 4 |
| Backend | Spring Boot 3.2 + JPA + Security |
| AI Service | Python FastAPI + OpenAI |
| Database | H2 (dev) / MySQL 8 (prod) |
| Blockchain | Solidity 0.8.24 + Hardhat + Ethers.js |
| DevOps | Docker Compose + GitHub Actions |
