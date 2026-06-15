# Health App with AI

An AI-powered health consultation platform connecting patients with doctors through intelligent symptom triage, multi-turn conversational intake, and role-based dashboards for patients, doctors, and administrators.

## Tech Stack

**Frontend** — React 19, Vite 8, Tailwind CSS 4, React Router 7, Recharts  
**Backend** — Node.js, Express 5, Mongoose 9, JWT, Nodemailer  
**AI** — Multi-provider support with automatic fallback (Groq → OpenRouter)

## Features

### Patient
- AI-powered symptom chat with multi-turn conversational intake
- Dashboard with medication tracking, dose logging, and refill alerts
- Health profile management (conditions, medications, dosages)
- Real-time consultation status tracking

### Doctor
- Patient list with search, filter, and status badges
- Detailed patient review with AI-generated summary and recommendations
- Editable recommendations with save/approve/forward workflow
- Urgent cases filtered by severity
- Archived cases with resolution tracking and forwarding stats
- Symptom trends visualization (Recharts line/bar charts)
- Medication history with adherence progress bars

### Admin
- User management with role-based access control
- Doctor application approval workflow with document verification
- AI monitoring dashboard with computed metrics
- Activity audit logs
- Doctor suspension/removal with confirmation dialogs

### Auth & Security
- Dual-token auth (access 1d, refresh 30d) with silent 401 retry
- Role-based route guards (Admin, Doctor, User)
- Suspended user detection on every API call

## Screenshots

<!-- TODO: Add screenshots -->

## Prerequisites

- Node.js 20+
- MongoDB 7+
- AI provider API keys (Groq, OpenRouter)

## Setup

### 1. Clone and install dependencies

```bash
git clone https://github.com/slipbit/health-app-with-ai.git
cd health-app-with-ai

# Backend
cd backend
cp .env.example .env
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Environment Variables

Create `backend/.env`:

| Variable | Required | Description |
|---|---|---|
| `PORT` | Yes | Server port (default: 5000) |
| `MONGO_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | JWT signing secret |
| `JWT_REFRESH_SECRET` | Yes | Refresh token signing secret |
| `AI_API_URL` | Yes* | Primary AI provider URL (Groq) |
| `AI_API_KEY` | Yes* | Primary AI provider API key |
| `AI_MODEL` | No | Primary AI model |
| `FALLBACK_AI_API_URL` | No | Fallback AI provider URL (OpenRouter) |
| `FALLBACK_AI_API_KEY` | No | Fallback AI provider API key |
| `FALLBACK_AI_MODEL` | No | Fallback AI model |
| `EMAIL_HOST` | For OTP | SMTP host |
| `EMAIL_PORT` | For OTP | SMTP port |
| `EMAIL_USER` | For OTP | SMTP username |
| `EMAIL_PASS` | For OTP | SMTP password |

*\* At least one AI provider must be configured.*

### 3. Run

```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npm run dev
```

Frontend runs on `http://localhost:5173`, backend on `http://localhost:5000`.

## Project Structure

```
health-app-with-ai/
├── backend/
│   ├── controllers/        # Route handlers
│   ├── middleware/         # Auth, role guards
│   ├── models/            # Mongoose schemas
│   ├── routes/            # Express routes
│   ├── services/          # AI provider logic
│   ├── utils/             # Activity logger, etc.
│   └── server.js          # Entry point
├── frontend/
│   ├── src/
│   │   ├── components/    # Reusable UI (Sidebar, Route guards)
│   │   ├── context/       # AuthContext
│   │   ├── pages/         # All page components
│   │   └── App.jsx        # Router setup
│   └── index.html
└── .gitignore
```

## API Overview

| Endpoint | Method | Description |
|---|---|---|
| `/api/auth/register` | POST | Register with name, email, OTP |
| `/api/auth/login` | POST | Login with email, OTP |
| `/api/auth/refresh` | POST | Refresh access token |
| `/api/chats` | GET/POST | List / create chats |
| `/api/chats/:id/messages` | POST | Send message |
| `/api/chats/:id/ai-respond` | POST | Trigger AI response |
| `/api/chats/:id/flag-recommendation` | POST | Report AI recommendation |
| `/api/medications/log` | POST | Log medication dose |
| `/api/doctors/patients` | GET | Doctor's patient list |
| `/api/admin/users` | GET | List all users (admin) |
| `/api/admin/applications` | GET | List doctor applications |

## License

MIT
