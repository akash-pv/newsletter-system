# Newsletter Management System

A full-stack Newsletter Management System with role-based workflow for article submission, review, approval, and newsletter generation.  
The system also integrates **AI-powered article generation using Ollama Mistral**.

---

## 🚀 Features

- Role-based access control
  - Admin
  - Approver
  - User

- Article submission system
- Article approval workflow
- Drag-and-drop newsletter builder
- Newsletter PDF generation
- AI article generation using **Ollama Mistral**
- Media upload support

---

## 🏗 System Architecture

User Browser  
      │  
      ▼  
React Frontend (Tailwind UI)  
      │  
      ▼  
Express.js API Server  
      │  
      ├── MySQL Database  
      │  
      └── Ollama AI Engine (Mistral)

The frontend communicates with the backend REST APIs.  
The backend handles authentication, article workflow, newsletter generation, and AI article generation using Ollama.

Frontend → React + Tailwind  
Backend → Node.js + Express  

## 📂 Project Structure

newsletter-system
│
├── newsletter-backend
│ ├── config
│ ├── middleware
│ ├── models
│ ├── routes
│ ├── uploads
│ ├── server.js
│├── newsletter-frontend
│ ├── src
│ ├── components
│ ├── pages
│
├── .gitignore
├── package.json
└── README.md
Database → MySQL  
AI Engine → Ollama (Mistral)
