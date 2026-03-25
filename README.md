<div align="center">

<img src="frontend/src/assets/logo.png" alt="Promet Logo" width="120" />

# Promet — AI Prompt Improver

**Transform your rough ideas into perfectly engineered AI prompts in seconds.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green?logo=node.js)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-blue?logo=react)](https://reactjs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-brightgreen?logo=mongodb)](https://mongodb.com)
[![Groq](https://img.shields.io/badge/Groq-Llama%203-orange)](https://groq.com)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./CONTRIBUTING.md)

[Live Demo](#) · [Report Bug](https://github.com/Tripadh/Promet/issues) · [Request Feature](https://github.com/Tripadh/Promet/issues)

</div>

---

## 📖 Table of Contents

- [About the Project](#-about-the-project)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running Locally](#running-locally)
- [API Reference](#-api-reference)
- [Project Structure](#-project-structure)
- [Improvement Modes](#-improvement-modes)
- [Domain Contexts](#-domain-contexts)
- [Admin Panel](#-admin-panel)
- [Observability](#-observability)
- [Contributing](#-contributing)
- [License](#-license)
- [Author](#-author)

---

## 🚀 About the Project

**Promet** is an open-source, full-stack AI Prompt Improver that helps users write better, clearer, and more effective prompts for large language models. Whether you're a developer, writer, marketer, or student — Promet takes your rough idea and transforms it into a production-quality prompt, instantly.

The engine is powered by **Groq's ultra-fast inference API** running **Meta's Llama 3 models**, with four distinct improvement modes tailored to different use cases. Every interaction is streamed in real time to the browser for a snappy, ChatGPT-like experience.

---

## ✨ Key Features

### 🤖 AI-Powered Prompt Engineering
- **4 improvement modes** — Quick, Balanced, Auto, Expert (see [Improvement Modes](#-improvement-modes))
- **6 domain contexts** — Tech, Social Media, Marketing, Creative Writing, Email, Education
- **Real-time token streaming** — responses stream character-by-character to the UI
- **Smart gibberish detection** — automatically rejects meaningless input and asks for clarification
- **Complexity analysis** — auto-detects simple/moderate/complex prompts and adjusts output depth
- **Conversation memory** — supports multi-turn refinements; update your prompt with natural language
- **Retry support** — generate alternative phrasings with a single click

### 🔐 Authentication & Security
- **Email / Password** registration with bcrypt password hashing
- **GitHub OAuth 2.0** social login via Passport.js
- **Google reCAPTCHA v2** bot protection on registration
- **OTP-based** forgot password & account deletion flows (email delivery via Nodemailer)
- **JWT authentication** with 7-day token expiry
- **Blocked email domain** enforcement (configurable blocklist for disposable addresses)
- **IP tracking & login logs** — every login event is recorded with method, IP, and user-agent

### 📚 Prompt History & Organization
- **Full conversation history** — every prompt and its improvement is saved
- **Favorite & pin** prompts for quick access
- **Thumbs up / down feedback** on each result
- **AI-generated chat titles** — conversations are auto-named based on context
- **Shared conversation links** — share any conversation via a public URL
- **Export to PDF** — download your prompt history as a formatted PDF

### 🛠️ Settings & Account Management
- **Light / Dark mode** toggle (system-default aware)
- **Update display name**
- **OTP-verified account deletion** with full data wipe

### 🛡️ Admin Panel
- View and manage all registered users
- View login activity and usage stats

### 📊 Observability
- **Langfuse** integration for tracing every LLM call (latency, tokens, model used, feedback scores)

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite 5, React Router v7, Vanilla CSS |
| **Backend** | Node.js 18+, Express 5, ES Modules |
| **Database** | MongoDB (Mongoose 9) |
| **AI Engine** | Groq SDK — Llama 3.1 8B Instant, Llama 3.3 70B Versatile |
| **Auth** | JWT, bcryptjs, Passport.js, passport-github2 |
| **Email** | Nodemailer |
| **CAPTCHA** | Google reCAPTCHA v2 |
| **Observability** | Langfuse |
| **PDF Export** | jsPDF + jsPDF-AutoTable |
| **Rate Limiting** | express-rate-limit |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (React SPA)                   │
│  Dashboard · History · Settings · Admin · Shared Chat   │
└───────────────────────────┬─────────────────────────────┘
                            │ HTTP + SSE (streaming)
                            ▼
┌─────────────────────────────────────────────────────────┐
│                  Express API Server                      │
│  /api/auth  ·  /api/prompts  ·  /api/admin              │
│                                                         │
│  Middleware: JWT Auth · Rate Limit · CORS · Passport    │
└──────┬──────────────┬──────────────┬────────────────────┘
       │              │              │
       ▼              ▼              ▼
  MongoDB         Groq API        Langfuse
  (Mongoose)    (Llama 3 LLMs)  (Observability)
```

The frontend is a **single-page application** (Vite build) that communicates with the Express REST API. AI results are delivered via **server-sent streaming**, so the user sees tokens as they are generated — zero page reloads.

---

## 🏁 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) v18 or later
- [npm](https://www.npmjs.com) v9 or later
- A running [MongoDB](https://mongodb.com) instance (local or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))
- A [Groq API Key](https://console.groq.com)

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/Tripadh/Promet.git
cd Promet
```

**2. Install backend dependencies**

```bash
cd backend
npm install
```

**3. Install frontend dependencies**

```bash
cd ../frontend
npm install
```

### Environment Variables

#### Backend — `backend/.env`

Create a file at `backend/.env` with the following variables:

```env
# ─── Server ───────────────────────────────────────────
PORT=5000
NODE_ENV=development

# ─── Database ─────────────────────────────────────────
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/promet

# ─── JWT ──────────────────────────────────────────────
JWT_SECRET=your_super_secret_jwt_key_here

# ─── Groq AI ──────────────────────────────────────────
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ─── Email (Nodemailer) ───────────────────────────────
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password

# ─── GitHub OAuth ─────────────────────────────────────
GITHUB_CLIENT_ID=your_github_oauth_app_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_app_client_secret
GITHUB_CALLBACK_URL=http://localhost:5000/api/auth/github/callback

# ─── Google reCAPTCHA ─────────────────────────────────
RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key
CAPTCHA_REQUIRED=false          # Set to "true" in production

# ─── Langfuse Observability (optional) ────────────────
LANGFUSE_PUBLIC_KEY=pk-lf-xxxxxxxx
LANGFUSE_SECRET_KEY=sk-lf-xxxxxxxx
LANGFUSE_HOST=https://cloud.langfuse.com

# ─── Blocked Email Domains (optional, comma-separated) ─
BLOCKED_EMAIL_DOMAINS=mailinator.com,tempmail.com
```

#### Frontend — `frontend/.env`

```env
VITE_API_URL=http://localhost:5000
VITE_RECAPTCHA_SITE_KEY=your_recaptcha_site_key
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

> **Note:** Never commit `.env` files to version control. Both are already listed in `.gitignore`.

### Running Locally

Run the backend and frontend in **two separate terminals**:

**Terminal 1 — Backend**
```bash
cd backend
npm run dev
```
Server starts at `http://localhost:5000`

**Terminal 2 — Frontend**
```bash
cd frontend
npm run dev
```
App opens at `http://localhost:5173`

---

## 📡 API Reference

All endpoints are prefixed with `/api`.

### Auth — `/api/auth`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/register` | — | Register a new user |
| `POST` | `/login` | — | Login and receive JWT |
| `GET` | `/me` | ✅ JWT | Get current authenticated user |
| `POST` | `/forgot-password` | — | Send OTP for password reset |
| `POST` | `/reset-password` | — | Reset password with OTP |
| `POST` | `/send-delete-otp` | ✅ JWT | Send OTP for account deletion |
| `DELETE` | `/delete-account` | ✅ JWT | Delete account with OTP verification |
| `GET` | `/github` | — | Initiate GitHub OAuth flow |
| `GET` | `/github/callback` | — | GitHub OAuth callback |

### Prompts — `/api/prompts`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/improve` | ✅ JWT | Improve a prompt (standard response) |
| `POST` | `/improve/stream` | ✅ JWT | Improve a prompt (SSE streaming) |
| `GET` | `/history` | ✅ JWT | Get user's prompt history |
| `GET` | `/conversation/:id` | ✅ JWT | Get a specific conversation |
| `DELETE` | `/conversation/:id` | ✅ JWT | Delete a conversation |
| `PATCH` | `/:id/favorite` | ✅ JWT | Toggle favorite on a prompt |
| `PATCH` | `/:id/pin` | ✅ JWT | Toggle pin on a prompt |
| `POST` | `/:id/feedback` | ✅ JWT | Submit feedback (👍 / 👎) |
| `POST` | `/share` | ✅ JWT | Create a shareable conversation link |
| `GET` | `/share/:token` | — | View a shared conversation (public) |

### Admin — `/api/admin`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/users` | ✅ JWT + Admin | List all users |
| `GET` | `/stats` | ✅ JWT + Admin | Usage statistics |

> All protected endpoints require an `Authorization: Bearer <token>` header.

---

## 📁 Project Structure

```
📦 Promet
 ┣ 📂 backend
 ┃ ┗ 📂 src
 ┃   ┣ 📂 config
 ┃   ┃ ┣ 📜 db.js               ← MongoDB connection
 ┃   ┃ ┗ 📜 passport.js         ← GitHub OAuth strategy
 ┃   ┣ 📂 controllers
 ┃   ┃ ┣ 📜 authController.js   ← Register, Login, OTP, OAuth
 ┃   ┃ ┣ 📜 promptController.js ← Improve, stream, share, feedback
 ┃   ┃ ┗ 📜 adminController.js  ← Admin user management
 ┃   ┣ 📂 middleware
 ┃   ┃ ┗ 📜 authMiddleware.js   ← JWT verification
 ┃   ┣ 📂 models
 ┃   ┃ ┣ 📜 User.js
 ┃   ┃ ┣ 📜 Prompt.js
 ┃   ┃ ┣ 📜 LoginLog.js
 ┃   ┃ ┣ 📜 MonthlyUsage.js
 ┃   ┃ ┗ 📜 ConversationShare.js
 ┃   ┣ 📂 routes
 ┃   ┃ ┣ 📜 authRoutes.js
 ┃   ┃ ┣ 📜 promptRoutes.js
 ┃   ┃ ┗ 📜 adminRoutes.js
 ┃   ┣ 📂 services
 ┃   ┃ ┣ 📜 aiService.js        ← Core AI: modes, streaming, validation
 ┃   ┃ ┣ 📜 otpService.js       ← OTP generation & verification
 ┃   ┃ ┗ 📜 emailService.js     ← Nodemailer email delivery
 ┃   ┣ 📂 utils
 ┃   ┃ ┗ 📜 errorHandlers.js    ← Global error & 404 handlers
 ┃   ┗ 📜 server.js             ← Express app entry point
 ┃
 ┗ 📂 frontend
   ┗ 📂 src
     ┣ 📂 api                   ← Axios API clients
     ┣ 📂 assets                ← Images, logo
     ┣ 📂 components
     ┃ ┣ 📂 auth                ← LoginForm, RegisterForm
     ┃ ┣ 📂 prompt              ← PromptInputBar, ResultCard
     ┃ ┗ 📂 ui                  ← Sidebar, Header, modals
     ┣ 📂 context               ← React Context providers (Auth, Theme)
     ┣ 📂 hooks                 ← Custom React hooks
     ┣ 📂 pages
     ┃ ┣ 📂 Home                ← Landing page
     ┃ ┣ 📂 Dashboard           ← Main workspace
     ┃ ┣ 📂 History             ← Prompt history
     ┃ ┣ 📂 Settings            ← User settings & theme
     ┃ ┣ 📂 Admin               ← Admin user management
     ┃ ┣ 📂 Login               ← Login page
     ┃ ┣ 📂 Register            ← Registration page
     ┃ ┣ 📂 ForgotPassword      ← Password reset flow
     ┃ ┣ 📂 SharedChat          ← Public conversation viewer
     ┃ ┣ 📂 OAuthSuccess        ← OAuth redirect handler
     ┃ ┣ 📂 Privacy             ← Privacy Policy
     ┃ ┣ 📂 Terms               ← Terms of Service
     ┃ ┗ 📂 AcceptableUse       ← Acceptable use policy
     ┣ 📂 services              ← Frontend service helpers
     ┣ 📂 styles                ← Global CSS tokens & base styles
     ┗ 📂 utils                 ← Utility helpers
```

---

## 🎛️ Improvement Modes

Promet offers four modes to match your use case:

| Mode | Model | Best For | Output Length |
|------|-------|----------|---------------|
| **⚡ Quick** | Llama 3.1 8B Instant | Fast, concise fixes | ~50 words |
| **⚖️ Balanced** | Llama 3.1 8B Instant | Clear, structured improvements | ~8–12 lines |
| **🤖 Auto** | Llama 3.3 70B Versatile | Creative expansion, fresh ideas | ~200+ words |
| **🎯 Expert** | Llama 3.3 70B Versatile | Architect-level, Markdown formatted | ~400+ words |

### Temperature by Mode
- **Quick** → `0.2` (deterministic, safe)
- **Balanced** → `0.4` (structured)
- **Expert** → `0.3` (precise and detailed)
- **Auto** → `0.65` (creative and divergent)

---

## 🌐 Domain Contexts

Select a domain to inject specialized style and vocabulary into the model's instructions:

| Domain | Focus |
|--------|-------|
| **💻 Tech / Code** | Senior developer tone, architecture, design patterns |
| **📱 Social Media** | Hooks, hashtags, platform-specific formatting |
| **📣 Marketing** | AIDA framework, CTAs, conversion copy |
| **✍️ Creative Writing** | Narrative tone, sensory details, literary style |
| **📧 Email** | Subject lines, structured body, professional tone |
| **🎓 Education** | Audience-level targeting, step-by-step breakdowns |

---

## 📊 Observability

Promet integrates with **[Langfuse](https://langfuse.com)** to trace every LLM call:

- Model name, mode, temperature, token counts
- Latency per request
- User feedback scores (👍 / 👎)
- Prompt and response text

Configure your Langfuse keys in `backend/.env` to enable tracing. Langfuse is optional — the app works fully without it.

---

## 🤝 Contributing

Contributions are what make open source amazing. Any contributions you make are **greatly appreciated**.

1. **Fork** the repository
2. **Create** your feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** your changes: `git commit -m 'Add some amazing feature'`
4. **Push** to the branch: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

Please open an issue first for major changes to discuss what you'd like to change.

### Code Style
- Use ES Modules (`import/export`) throughout
- Follow the existing file/folder naming conventions
- Keep components focused and single-purpose
- Add meaningful commit messages

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](./LICENSE) file for details.

---


<div align="center">

Made with ❤️ and powered by [Groq](https://groq.com) · [Llama 3](https://llama.meta.com) · [MongoDB](https://mongodb.com)

⭐ **Star this repo if you found it useful!** ⭐

</div>
