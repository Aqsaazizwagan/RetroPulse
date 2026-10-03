# RetroPulse — Refurbished Vintage Electronics & Gaming Marketplace

RetroPulse is a specialized marketplace for certified refurbished vintage gaming consoles, handhelds, CRT monitors, and modding parts.

---

## Repository Structure

```text
RetroPulse/
├── migrations/
│   └── 001_initial_schema.sql    # PostgreSQL schema DDL with constraints & indexes
├── seeds/
│   └── 001_seed_data.sql         # Seed data (categories, users, products, variants)
├── src/
│   ├── middleware/
│   │   └── auth.js               # JWT authentication & admin authorization
│   ├── services/
│   │   ├── categoryService.js    # Category hierarchy & cycle prevention
│   │   └── variantService.js     # Variant/SKU combination & stock rules
│   ├── app.js                    # Express app & administrative routes
│   └── server.js                 # Server entrypoint
├── tests/
│   ├── categoryHierarchy.test.js # Category cycle prevention tests
│   ├── variantSkuStock.test.js   # Variant/SKU and stock rules tests
│   └── adminAuth.test.js         # Admin authorization (401/403) tests
├── docs/
│   ├── SPRINT_1.md               # Sprint 1 documentation
│   └── SPRINT_2.md               # Sprint 2 documentation (Section 11 format)
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## Quick Start Guide

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Automated Business Rule Tests
Run the automated test suite verifying category cycle prevention, variant/SKU combinations, stock rules, and admin authorization:
```bash
npm test
```
*Or natively without external dependencies:*
```bash
node --test tests/*.test.js
```

### 3. Run Migrations & Seeds (PostgreSQL)
```bash
# Connect to PostgreSQL and execute:
psql -d retropulse_db -f migrations/001_initial_schema.sql
psql -d retropulse_db -f seeds/001_seed_data.sql
```

### 4. Start Development Server
```bash
npm run dev
# or
npm start
```
Default server port: `http://localhost:5000`

---

## Sprint Documentation
- [Sprint 1: System Architecture & Scope Definition](file:///C:/Users/PMLS/Desktop/RetroPulse/docs/SPRINT_1.md)
- [Sprint 2: Data Modeling, Database Implementation & REST API Architecture](file:///C:/Users/PMLS/Desktop/RetroPulse/docs/SPRINT_2.md)
