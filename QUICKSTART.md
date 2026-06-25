# Quick Start Guide

## Installation

1. **Install dependencies:**
```bash
npm run install:all
```

## Running the Application

**Option 1: Run both servers together (recommended):**
```bash
npm run dev
```

**Option 2: Run separately:**

Terminal 1 (Backend):
```bash
cd backend
npm run dev
```

Terminal 2 (Frontend):
```bash
cd frontend
npm run dev
```

## Access the App

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Health Check: http://localhost:3001/api/health

## First Steps

1. **Generate a Contract:**
   - Go to Contracts page
   - Fill in project details
   - Generate and download your contract

2. **Assess a Client:**
   - Go to Client Risk page
   - Add a new client
   - Select risk signals you've observed
   - See the risk score and explanation

3. **Track an Invoice:**
   - Go to Invoices page
   - Create an invoice
   - Generate payment reminders (polite or firm)

4. **Check Red Flags:**
   - Go to Red Flags page
   - Paste client messages
   - See detected risky language

## Database

The SQLite database is automatically created in `backend/db/freelance_shield.db` on first run.

No additional setup required!

