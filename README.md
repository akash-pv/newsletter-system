# 📨 Newsletter Management System

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=flat-square&logo=mysql&logoColor=white)
![Ollama](https://img.shields.io/badge/Ollama-Mistral_7B-FF6B35?style=flat-square)
![License](https://img.shields.io/badge/License-Proprietary-red?style=flat-square)

A full-stack Newsletter Management System with **role-based workflows**, **AI-powered article generation** using Ollama Mistral, and a built-in **Analytics Module** tracking open rates, click-through rates, and content performance.

[Features](#-features) · [Architecture](#-architecture) · [Screenshots](#-screenshots) · [Setup](#-getting-started) · [API Docs](#-api-reference) · [Analytics](#-analytics-module)

</div>

---

## ✨ Features

### Core System
- **Role-based access control** — Admin, Approver, and User roles with JWT authentication
- **Article submission workflow** — multi-stage submit → review → approve → publish pipeline
- **Drag-and-drop newsletter builder** — visually compose newsletters from approved articles
- **PDF generation** — export finalized newsletters as downloadable PDFs
- **Media upload support** — images and attachments with Multer

### AI Integration
- **Ollama Mistral 7B** — local AI model for article generation from a single title prompt
- **67% faster content creation** — AI drafts articles in ~15 minutes vs ~45 minutes manually
- **Human-in-the-loop** — all AI content goes through the same approval workflow as manual articles

### Analytics Module
- Real-time **open rate** and **click-through rate** tracking per subscriber
- **AI vs manual** article creation time and approval time comparison
- **Top subscriber** engagement leaderboard
- **Automated weekly CSV export** — runs every Monday at 8AM via cron job
- Admin analytics dashboard with KPI cards, bar charts, donut charts, and performance tables

---

## 🏗 Architecture

![System Architecture](screenshots/architecture.png)

The system is divided into four layers:

**Client Layer** — React.js frontend with Tailwind CSS, communicating via REST APIs with JWT-based authentication and role-based routing.

**Application Layer** — Express.js backend handling all business logic including article workflows, newsletter generation, AI integration, and the analytics tracking engine.

**Data Layer** — MySQL relational database storing users, articles, roles, newsletter sends, and 5 dedicated analytics tables for open/click tracking and weekly summaries.

**AI Layer** — Ollama running Mistral 7B locally, exposed via REST API. Articles are drafted from a title prompt, reviewed by an approver, and published through the standard workflow.

---

## 🔄 Workflow

![Article Workflow](screenshots/workflow.png)

### Standard Path
1. **User** submits an article (manual or AI-generated)
2. **Approver** reviews and approves or rejects
3. **Admin** selects approved articles and builds a newsletter using the drag-and-drop builder
4. Newsletter is exported as PDF and sent to subscribers
5. **Analytics module** automatically tracks opens and clicks

### AI Generation Path
1. User enters an article title
2. Ollama Mistral generates a full draft (~15 minutes)
3. Draft enters the same approval queue as manual articles
4. Approver reviews AI content before it reaches the newsletter

---

## 📸 Screenshots

### Analytics Dashboard
![Analytics Dashboard](screenshots/analytics-dashboard.png)

---

## 📁 Project Structure

```
newsletter-system/
│
├── newsletter-backend/
│   ├── analytics/
│   │   ├── routes/
│   │   │   └── analyticsRoutes.js       # 7 REST API endpoints
│   │   ├── services/
│   │   │   ├── analyticsService.js      # Core DB queries & KPI logic
│   │   │   └── weeklyExportJob.js       # Cron job — every Monday 8AM
│   │   ├── exports/                     # Auto-generated weekly CSV files
│   │   └── analytics_schema.sql         # Analytics DB schema (5 tables)
│   │
│   ├── config/
│   │   └── db.js                        # MySQL connection pool
│   ├── middleware/
│   │   └── auth.js                      # JWT middleware
│   ├── models/
│   │   ├── Article.js
│   │   ├── Notification.js
│   │   └── User.js
│   ├── routes/
│   │   ├── adminRoutes.js
│   │   ├── articleRoutes.js
│   │   ├── authRoutes.js
│   │   ├── faqRoutes.js
│   │   ├── newsletterRoutes.js
│   │   ├── notificationRoutes.js
│   │   └── roleRoutes.js
│   ├── uploads/
│   ├── .env
│   ├── createSampleUser.js
│   └── index.js
│
├── newsletter-frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── assets/
│   │   ├── components/
│   │   └── pages/
│   │       ├── AnalyticsDashboard.jsx
│   │       ├── ApproveArticles.js
│   │       ├── Dashboard.js
│   │       ├── FAQPage.js
│   │       ├── GenerateNewsletter.js
│   │       ├── Login.js
│   │       └── PendingApprovalDashboard.js
│   └── public/
│
├── screenshots/
├── LICENSE
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

| Requirement | Version |
|---|---|
| Node.js | v18+ |
| MySQL | 8.0+ |
| Ollama | Latest |
| Mistral model | `ollama pull mistral` |


## 📊 Analytics Module

### Database Schema

**Core Tables (11)**
```
user                  — user accounts with roles and approval status
role                  — role definitions (Admin, Approver, User)
user_role             — user-role mapping (many-to-many)
article               — submitted articles with title, content, author
articlecategory       — article categorisation
articlestatus         — approval workflow states per article
articleworkflow       — full audit trail of status changes
articlemedia          — media attachments for articles
newsletter            — published newsletters with metadata
nldata                — newsletter content and PDF storage
notification          — user notifications for approvals/rejections
faq                   — FAQ entries
```

**Analytics Tables (5 — added by analytics module)**
```
newsletter_sends          — every newsletter sent (recipients, article count, timestamp)
newsletter_opens          — per-subscriber open events
newsletter_clicks         — per-subscriber click events with article reference
article_analytics         — creation time, approval time, AI vs manual flag
weekly_analytics_summary  — weekly snapshot table for CSV export
```

### Key Metrics Tracked

| Metric | Description |
|---|---|
| Open rate | % of recipients who opened each newsletter |
| Click rate | % of recipients who clicked at least one article |
| AI time saved | % reduction in content creation time vs manual |
| Avg approval time | Minutes from article submission to approval |
| Top subscribers | Most engaged readers ranked by open count |
| Weekly trend | Article submission volume week over week |

### CSV Export Sample

```csv
Week Start,Week End,Newsletters Sent,Articles Submitted,Articles Approved,AI Generated,Manual,Avg Approval Time (mins),Avg Open Rate (%),Avg Click Rate (%)
2025-04-14,2025-04-20,1,8,7,5,3,38.0,72.0,38.0
```

Auto-saved to `analytics/exports/` every Monday at 8:00 AM.
Files older than 90 days are automatically deleted.

### Internal Test Results (25 testers)

| Newsletter | Sent To | Opens | Open Rate | Clicks | Click Rate |
|---|---|---|---|---|---|
| Tech Digest — Apr | 25 | 19 | **76%** | 10 | **40%** |
| AI Tools Weekly #2 | 23 | 16 | **70%** | 9 | **39%** |
| Product Update — Q1 | 20 | 14 | **70%** | 7 | **35%** |

---

## ⚙️ Environment Variables

| Variable | Description | Default |
|---|---|---|
| `PORT` | Backend server port | `5000` |
| `DB_HOST` | MySQL host | `localhost` |
| `DB_USER` | MySQL username | — |
| `DB_PASSWORD` | MySQL password | — |
| `DB_NAME` | MySQL database name | — |
| `JWT_SECRET` | Secret key for JWT tokens | — |
| `OLLAMA_URL` | Ollama API base URL | `http://localhost:11434` |

---

## 📄 License

Copyright © 2025 Akash PV. All rights reserved.

This repository is made available for **portfolio and demonstration purposes only**.
Unauthorized copying, modification, distribution, or commercial use of this code
without explicit written permission from the author is strictly prohibited.

---

## 👨‍💻 Author

**Akash PV** — Junior Data Engineer

[![GitHub](https://img.shields.io/badge/GitHub-akash--pv-181717?style=flat-square&logo=github)](https://github.com/akash-pv)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-akash--pv-0A66C2?style=flat-square&logo=linkedin)](https://linkedin.com/in/akash-pv)
[![Email](https://img.shields.io/badge/Email-akash.thushara2002@gmail.com-EA4335?style=flat-square&logo=gmail)](mailto:akash.thushara2002@gmail.com)
