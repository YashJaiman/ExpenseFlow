# ExpenseFlow 💸

Modern full-stack expense tracking and financial analytics platform built with Node.js, Express, MongoDB, and Vanilla JavaScript.

Designed with a premium fintech-inspired UI featuring interactive analytics, dark/light themes, responsive dashboards, animated charts, and secure JWT authentication.

---

## ✨ Features

### 🔐 Authentication
- JWT-based authentication
- Secure password hashing using bcryptjs
- Protected routes & middleware
- Persistent login sessions

### 💰 Expense Management
- Add income & expense transactions
- Edit & delete transactions
- Category-based transaction organization
- Search, filter & sorting support
- Export transactions to CSV

### 📊 Analytics Dashboard
- Monthly income vs expense overview
- Spending trend charts
- Category breakdown analytics
- Financial summary cards
- Real-time balance calculations

### 🎨 Modern UI/UX
- Premium dark/light theme
- Responsive SaaS-style dashboard
- Interactive charts with Chart.js
- Smooth animations & transitions
- Modern sidebar navigation
- Mobile responsive design

### ⚡ Performance & Security
- MongoDB with Mongoose
- RESTful API architecture
- CORS protection
- Rate limiting
- Environment variable configuration

---

# 📸 Screenshots

## 🔑 Login Page

![Login Page](Screenshots/Login%20EF.png)

---

## 📝 Sign Up Page

![Sign Up Page](Screenshots/SignUP%20EF.png)

---

## 📊 Dashboard Overview

![Dashboard](Screenshots/Dashboard%20EF.png)

---

## 💳 Transactions Page

![Transactions](Screenshots/Transaction%20EF.png)

---

# 🛠️ Tech Stack

## Frontend
- HTML5
- CSS3
- Vanilla JavaScript
- Chart.js

## Backend
- Node.js
- Express.js
- MongoDB
- Mongoose

## Authentication
- JWT (jsonwebtoken)
- bcryptjs

## Deployment
- Vercel (Frontend)
- Render (Backend)
- MongoDB Atlas (Database)

---

# 📁 Project Structure

```text
Expense Flow/
│
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── package.json
│   ├── server.js
│   └── .env
│
├── frontend/
│   ├── assets/
│   │   ├── css/
│   │   ├── js/
│   │   └── images/
│   │
│   ├── index.html
│   ├── dashboard.html
│   ├── transactions.html
│   └── analytics.html
│
├── Screenshots/
│   ├── Dashboard EF.png
│   ├── Login EF.png
│   ├── SignUP EF.png
│   └── Transaction EF.png
│
├── .gitignore
├── package.json
└── README.md
```

---

# ⚙️ Backend Setup

## 1️⃣ Navigate to backend

```bash
cd backend
```

## 2️⃣ Install dependencies

```bash
npm install
```

## 3️⃣ Create `.env`

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

## 4️⃣ Run backend server

```bash
npm run dev
```

Server runs on:

```text
http://localhost:5000
```

---

# 🌐 Frontend Setup

## 1️⃣ Navigate to frontend

```bash
cd frontend
```

## 2️⃣ Run using Live Server

Or simply open:

```text
index.html
```

---

# 🚀 Deployment

## Backend Deployment (Render)

### Steps
1. Push project to GitHub
2. Go to Render
3. Create New Web Service
4. Connect GitHub repository
5. Select backend folder

### Environment Variables

```env
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret
JWT_EXPIRES_IN=7d
NODE_ENV=production
CORS_ORIGIN=https://your-frontend-url.vercel.app
```

---

## Frontend Deployment (Vercel)

### Steps
1. Import GitHub repository
2. Select frontend folder
3. Add environment variable:

```env
VITE_API_URL=https://your-backend.onrender.com/api/v1
```

4. Deploy

---

# 📡 API Endpoints

## Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register user |
| POST | `/api/v1/auth/login` | Login user |
| GET | `/api/v1/auth/me` | Current user |

---

## Transactions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/transactions` | Get all transactions |
| POST | `/api/v1/transactions` | Add transaction |
| PUT | `/api/v1/transactions/:id` | Update transaction |
| DELETE | `/api/v1/transactions/:id` | Delete transaction |

---

# 🔥 Future Improvements

- AI-powered financial insights
- Budget planning system
- Recurring transactions
- PDF report generation
- Multi-currency support
- Cloud sync
- Notification reminders

---

# 👨‍💻 Author

### Yash Jaiman

Built with ❤️ using modern full-stack web technologies.

---

# ⭐ Support

If you like this project, give it a ⭐ on GitHub.