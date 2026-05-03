# Team Task Manager

A full-stack **MERN** Team Task Manager with JWT authentication and Role-Based Access Control (Admin / Member).

## Tech Stack

| Layer    | Technology                         |
|----------|------------------------------------|
| Frontend | React 18 + Vite + Tailwind CSS     |
| Backend  | Node.js + Express                  |
| Database | MongoDB (Mongoose)                 |
| Auth     | JWT (7-day tokens) + bcryptjs      |

## Features

- 🛡️ **Separate Admin & Member login portals** with animated backgrounds
- 🔐 **JWT authentication** with protected routes
- 📊 **Dashboard** with live task stats & completion progress
- ✅ **Task management** — create, assign, update status, paginate
- 📁 **Project management** — create, edit, delete, manage members
- 👤 **Role-based access** — Admins manage everything; Members update assigned tasks

## Quick Start

### Prerequisites
- Node.js ≥ 18
- MongoDB running locally on port 27017

### Backend
```bash
cd backend
cp .env.example .env   # fill in your values
npm install
npm run dev            # http://localhost:5000
```

### Frontend
```bash
cd frontend
npm install
npm run dev            # http://localhost:5173
```

### Admin Account (Seed Script)

Run the seed script to create default admin accounts:

```bash
cd backend
node seed.js
```

Default admin credentials after seeding:

| Email            | Password    | Role  |
|------------------|-------------|-------|
| admin@test.com   | 123456      | Admin |
| admin2@test.com  | admin@1234  | Admin |

> The seed script is idempotent — running it multiple times won't create duplicates.

## Project Structure

```
company project/
├── backend/
│   ├── models/          # Mongoose schemas (User, Project, Task)
│   ├── server.js        # Express app + all routes & controllers
│   ├── .env.example
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/  # Navbar, Guards (route protection)
    │   ├── pages/       # Login, AdminLogin, Dashboard, Tasks, Projects
    │   ├── services/    # Axios API client
    │   ├── App.jsx
    │   └── main.jsx
    └── package.json
```

## Environment Variables

### Backend `.env`
```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/team-task-manager
JWT_SECRET=your_secret_here
NODE_ENV=development
```
