# Evallo HRMS - Prototype solution

This is a clean, well-organized prototype of the Human Resource Management System (HRMS) assignment.
It is a runnable full-stack prototype intended for demo and local development.

## What is included
- `backend/` — Express backend with JWT auth, in-memory data storage, endpoints for employees, teams,
  assignments, and logs.
- `frontend/` — React app with simple, polished UI for Login/Register, Employees, Teams, Dashboard, and Logs.
- `README.md` — this file.

## Important notes
- This prototype uses an **in-memory store** (no SQL database). It is intentionally structured so you can
  replace the backend storage with a real database (Sequelize + Postgres) later.
- The backend writes audit logs to `backend/src/logs.json`.
- A convenience endpoint `POST /api/_seed` creates a sample organisation, admin and data (use the provided Seed button on the login form).

## Run locally
1. Backend
```bash
cd backend
npm install
npm run start
# backend runs on http://localhost:5000
```

2. Frontend
```bash
cd frontend
npm install
npm run start
# frontend runs on http://localhost:3000
```

3. Seed demo (optional)
- Open frontend, use the "Seed demo" button on the sign-in form. It creates a sample org with:
  - email: admin@acme.test
  - password: Password123

## What's intentionally left for later
- Persistent SQL DB (Postgres) and ORM (Sequelize) are not wired in this prototype.
- Migrations and Docker files are omitted to keep the deliverable focused and readable.

## Project decisions (short)
- Minimal, readable code with limited comments and natural-language README.
- Clean, modern UI spacing and simple visual design; no external CSS frameworks used so styles are easy to tweak.
- No system-y terminology in code or comments.

If you want, I can convert the backend to use Postgres + Sequelize and add migrations next.

## Environment
Create a `.env` file using the values from `.env.example`.

## Screenshots
Add your UI screenshots here before submission.
