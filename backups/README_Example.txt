# 🎉 New Hire Onboarding App

A powerful platform for HR teams to streamline and automate the onboarding process for new employees, ensuring a consistent, engaging, and efficient experience.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Usage](#usage)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

The New Hire Onboarding App is designed to help organizations manage all aspects of employee onboarding, from welcome messages to paperwork, task tracking, and compliance training. With customizable templates, automation, and integrations, teams can offer a top-tier onboarding experience for every new hire.

---

## Features

- 📑 Customizable onboarding checklists and templates
- 🔐 Secure document upload and digital signature support
- ⏰ Automated reminders and progress tracking
- 💬 Integrated chat for HR and new hires
- 📅 Calendar sync with Google and Outlook
- 📈 Admin dashboard with analytics and reporting
- 🛠️ Slack and email notifications

---

## Tech Stack

- **Frontend:** React, TypeScript, Tailwind CSS
- **Backend:** Node.js, Express
- **Database:** PostgreSQL (via Prisma ORM)
- **Authentication:** Auth0
- **Integrations:** Slack, Google Calendar, Outlook
- **Deployment:** Vercel (Frontend), Railway (Backend)
- **CI/CD:** GitHub Actions

---

## Getting Started

### Prerequisites

- Node.js v18+
- PostgreSQL 14+
- Yarn or npm
- Docker (optional, for local database)

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/your-org/onboarding-app.git
cd onboarding-app
cp .env.example .env
yarn install
```

Set up the database:

```bash
createdb onboarding_app_dev
yarn prisma migrate dev --name init
yarn prisma generate
```

---

## Configuration

Edit the `.env` file to provide configuration details:

```env
DATABASE_URL=postgresql://localhost/onboarding_app_dev
AUTH0_DOMAIN=your-auth0-domain
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-client-secret
SLACK_WEBHOOK_URL=your-slack-webhook-url
EMAIL_SERVER=smtp://your-smtp-server
GOOGLE_API_KEY=your-google-api-key
OUTLOOK_CLIENT_ID=your-outlook-client-id
```

For a full list and explanation of required keys, see `.env.example`.

---

## Usage

### Start Development

```bash
yarn dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:4000

### Build for Production

```bash
yarn build
yarn start
```

### Database Migrations

```bash
yarn prisma migrate dev
```

---

## Testing

Run all unit and integration tests:

```bash
yarn test
```

Generate a coverage report:

```bash
yarn test:coverage
```

---

## Deployment

### Frontend (Vercel)

1. Connect your repository to Vercel.
2. Add environment variables via the Vercel dashboard.
3. Push to the `main` branch for automatic deployment.

### Backend (Railway)

1. Link your repository in Railway.
2. Add environment variables in the Railway dashboard.
3. Deploy via GitHub integration or the Railway CLI.

---

## Contributing

We welcome all contributions! To get started:

1. Fork this repository.
2. Create a new branch:
   ```bash
   git checkout -b feature/your-feature
   ```
3. Make your changes and commit them:
   ```bash
   git commit -m "Add awesome feature"
   ```
4. Push your branch:
   ```bash
   git push origin feature/your-feature
   ```
5. Open a pull request on GitHub.

Please review our [Code of Conduct](./CODE_OF_CONDUCT.md) and [Contributing Guidelines](./CONTRIBUTING.md) before contributing.

---

## License

This project is licensed under the [MIT License](./LICENSE).
