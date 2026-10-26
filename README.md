# FinTrack - Personal Finance & Budget Tracker

FinTrack is a full-stack personal finance application built with Express.js, React 19, TypeScript, Tailwind CSS, and MongoDB (with a resilient in-memory fallback store).

## Architecture Overview

```text
financial-tracking-app/
├── backend/
│   ├── src/
│   │   ├── config/          # Database & environment configuration
│   │   │   ├── database.ts
│   │   │   └── env.ts
│   │   ├── controllers/     # HTTP request handlers & response formatting
│   │   │   ├── auth.controller.ts
│   │   │   ├── transaction.controller.ts
│   │   │   ├── budget.controller.ts
│   │   │   └── category.controller.ts
│   │   ├── services/        # Business logic & data operations
│   │   │   ├── auth.service.ts
│   │   │   ├── email.service.ts
│   │   │   ├── fallbackStore.service.ts
│   │   │   ├── transaction.service.ts
│   │   │   ├── budget.service.ts
│   │   │   └── category.service.ts
│   │   ├── routes/          # Express route definitions
│   │   │   ├── auth.routes.ts
│   │   │   ├── transaction.routes.ts
│   │   │   ├── budget.routes.ts
│   │   │   ├── category.routes.ts
│   │   │   └── index.ts
│   │   ├── models/          # Mongoose database schemas & models
│   │   │   ├── User.ts
│   │   │   ├── Transaction.ts
│   │   │   ├── Budget.ts
│   │   │   └── Category.ts
│   │   ├── middleware/      # Authentication & error handling middleware
│   │   │   ├── auth.middleware.ts
│   │   │   └── error.middleware.ts
│   │   ├── validators/      # Centralized request validation
│   │   │   ├── auth.validator.ts
│   │   │   ├── transaction.validator.ts
│   │   │   ├── budget.validator.ts
│   │   │   └── category.validator.ts
│   │   ├── types/           # Shared backend TypeScript types
│   │   │   └── index.ts
│   │   ├── app.ts           # Express application setup
│   │   └── server.ts        # Server entry point & Vite middleware / static hosting
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/      # Reusable UI dialogs & banners
│   │   │   ├── layout/      # Shared header & navigation sidebar
│   │   │   └── features/    # Feature-specific modals & forms
│   │   ├── pages/           # Route views (Home, Auth, Dashboard, etc.)
│   │   ├── context/         # React Context providers (Auth, Finance, Language)
│   │   ├── services/        # Frontend API client services
│   │   ├── utils/           # Formatting, icons, & mock data
│   │   ├── types/           # Shared frontend TypeScript interfaces
│   │   ├── constants/       # App constants & storage keys
│   │   ├── App.tsx          # Application shell & state orchestration
│   │   ├── main.tsx         # App entry point
│   │   └── index.css        # Tailwind styles & theme variables
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm (v9+)

### Installation

```bash
npm install
```

### Environment Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Key environment variables:
- `PORT`: HTTP server port (default: `3000`)
- `MONGODB_URI`: MongoDB connection string. If omitted or unconfigured, FinTrack runs automatically in resilient fallback store mode with complete demo data.
- `JWT_SECRET`: Secret key for signing JWT session tokens.
- `SMTP_*`: Optional SMTP server credentials for real email verification codes. If omitted, codes are displayed in the UI notification sandbox.

### Running Development Server

```bash
npm run dev
```

The application will start on `http://localhost:3000`.

### Type Checking & Build

```bash
# Type check all frontend & backend code
npm run lint

# Production build
npm run build
```

