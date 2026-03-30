# SafeSchool Africa

A web-based Child Online Protection Platform that allows students to report online safety incidents (cyberbullying, grooming, harassment, threats, and more) and enables school staff to manage, track, and resolve those cases.

---

## Table of Contents

- About the Project
- Features
- Tech Stack
- Prerequisites
- Installation & Setup
- Running the App
- Demo Accounts
- Pages & Routes
- API Endpoints
- Project Structure

---

## About the Project

Students in African schools face growing risks online — cyberbullying, grooming, harassment, and threats — with no safe, structured way to report incidents to their school. SafeSchool Africa provides a simple, anonymous-friendly reporting platform where students can submit incidents, and staff can track, update, and resolve each case through a dedicated dashboard.

---

## Features

- **Role-based login** — Student, Staff, and Admin roles
- **Incident reporting** — Students submit reports with category, description, location, and urgency flag
- **Anonymous reporting** — Students can report without revealing their identity
- **Staff dashboard** — View all cases, filter by status, update case progress
- **Case detail view** — Full audit trail, notes, and checklist per case
- **Analytics dashboard** — Charts for category breakdown, status distribution, and monthly trends
- **Persistent storage** — SQLite database via sql.js

---

## Tech Stack

| Layer    | Technology                        |
|----------|-----------------------------------|
| Backend  | Node.js, Express.js               |
| Database | SQLite (via sql.js — no install)  |
| Frontend | Vanilla HTML, CSS, JavaScript     |
| Charts   | Chart.js                          |

---

## Prerequisites

Make sure you have the following installed before you begin:

- **Node.js** v18 or higher — [Download here](https://nodejs.org/)
- **npm** (comes bundled with Node.js)

To verify your installations, run:

```bash
node --version
npm --version
```

---

## Installation & Setup

Follow these steps exactly to get the project running on your local machine.

### 1. Clone the repository

```bash
git clone https://github.com/AceArnold/safeschoolafrica.git
```

### 2. Navigate into the project folder

```bash
cd safeschoolafrica
```

### 3. Install dependencies

```bash
npm install
```

This will install `express`, `cors`, and `sql.js` as listed in `package.json`.

> **Note:** Do NOT run `npm install` inside the `node_modules` folder. Run it from the root of the project only.

---

## Running the App

### Start the server

```bash
npm start
```

You should see this output in your terminal:

```
SafeSchool Africa running at http://localhost:3000
   Demo accounts:
   student@test.com / Test1234!
   staff@test.com   / Test1234!
   admin@test.com   / Test1234!
```

### Open the app in your browser

```
http://localhost:3000
```

> The server runs on port **3000** by default. If port 3000 is in use on your machine, you can change it by setting the `PORT` environment variable:
> ```bash
> PORT=4000 npm start
> ```

---

## Demo Accounts

The database is automatically seeded with three demo accounts on first run. Use these to log in:

| Role    | Email                  | Password   |
|---------|------------------------|------------|
| Student | student@test.com       | Test1234!  |
| Staff   | staff@test.com         | Test1234!  |
| Admin   | admin@test.com         | Test1234!  |

> **Student** — can submit new reports and view their own submissions.  
> **Staff** — can view all reports, update statuses, add notes, and manage checklists.  
> **Admin** — has access to the analytics dashboard and full system overview.

---

## Pages & Routes

| Page                  | URL                        | Who can access     |
|-----------------------|----------------------------|--------------------|
| Landing page          | `/`                        | Everyone           |
| Login                 | `/login.html`              | Everyone           |
| Submit a report       | `/student-report.html`     | Students           |
| Staff case dashboard  | `/staff-dashboard.html`    | Staff / Admin      |
| Case detail           | `/case-detail.html?id=...` | Staff / Admin      |
| Analytics             | `/analytics.html`          | Admin              |

---

## API Endpoints

The backend exposes the following REST API:

| Method | Endpoint                        | Description                        |
|--------|---------------------------------|------------------------------------|
| POST   | `/api/auth/login`               | Log in with email & password       |
| GET    | `/api/reports`                  | Get all reports                    |
| POST   | `/api/reports`                  | Submit a new report                |
| GET    | `/api/reports/:id`              | Get a single report by ID          |
| PATCH  | `/api/reports/:id`              | Update report status or add a note |
| GET    | `/api/reports/:id/audit`        | Get full audit trail for a case    |
| POST   | `/api/reports/:id/audit`        | Add an audit log entry             |
| GET    | `/api/reports/:id/checklist`    | Get checklist state for a case     |
| PATCH  | `/api/reports/:id/checklist`    | Update checklist state             |
| GET    | `/api/analytics`                | Get analytics summary data         |

