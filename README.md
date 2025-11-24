# 📚 Library Management System (LMS)

A full-stack, cross-platform Library Management System designed for peer-to-peer item renting and lending.

- **Backend:** Node.js, Express, MongoDB
- **Admin Panel:** React, Vite, shadcn/ui
- **Mobile App:** React Native, Expo

This LMS allows **Givers** to list items, **Takers** to request rentals, and **Admins** to manage the entire platform.

## 🚀 Features

### 🔧 Backend (Node.js + Express + TypeScript)
- Secure authentication with **JWT**
- Role-based access control (Admin / Giver / Taker)
- Item listing, categorization, and image uploads via **Cloudinary**
- Rental requests and queue management
- Rental history tracking and **PDF receipt generation**
- Notifications via **Twilio WhatsApp** and **Nodemailer**
- Rate-limiting with **Upstash Redis**
- Cron jobs for reminders
- Unit & integration testing with **Jest**

### 🖥️ Frontend Admin (React + Vite + TypeScript)
- Responsive admin dashboard
- Full user management (block, delete, view activity)
- Item and category management
- Rental and queue tracking
- Analytics and charts
- Modern UI using **shadcn/ui**, **Tailwind**, & **Framer Motion**

### 📱 Frontend User (React Native + Expo)
- User authentication and profile management
- Browse items by category and search
- Request items and track queue position
- View personal rental history
- Upload item images
- Cross-platform: **Android, iOS, and Web**

## 🛠️ Tech Stack

| Area | Technology |
| :--- | :--- |
| **Backend** | Node.js, Express.js, TypeScript, MongoDB, Mongoose |
| **Frontend Admin** | React, Vite, TypeScript, Tailwind CSS, shadcn/ui |
| **Frontend User** | React Native, Expo, TypeScript, Jotai, Axios |
| **Auth & Database** | JWT, Mongoose, Upstash Redis, Zod (Validation) |
| **Services & APIs** | Cloudinary, Twilio, Nodemailer |
| **Testing** | Jest |

## 🗂️ Folder Structure

Here is a high-level overview of the project structure:

```bash
LMS/
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   └── server.ts
│   ├── .env.example
│   └── package.json
│
├── frontend-admin/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/ (utils, shadcn)
│   │   ├── pages/
│   │   ├── services/
│   │   └── App.tsx
│   ├── .env.example
│   └── package.json
│
└── frontend-user/
    ├── app/ (screens)
    ├── assets/
    ├── components/
    ├── constants/
    ├── hooks/
    ├── context/
    ├── .env.example
    └── package.json
```

## 🚀 Getting Started

Follow these instructions to get the project up and running on your local machine.

### 1. Prerequisites

Make sure you have the following installed:
- Node.js (v18 or later recommended)
- npm or yarn
- Git
- MongoDB (or a MongoDB Atlas account)

### 2. Clone the Repository

```bash
git clone https://github.com/jaypawar90171/LMS.git
cd LMS
```

### 3. Installation & Setup
You will need to run setup in three separate terminal sessions, one for each part of the project.

#### 🟦 Backend Setup

##### 📌 Install Dependencies
```bash
cd backend
npm install
```

##### 📌 Create .env File in /backend
```bash
PORT=3000
MONGODB_URI=
SECRET_KEY=

UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

EMAIL_USER=
EMAIL_PASS=

TWILIO_WHATSAPP_NUMBER=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

##### 📌 Run the Backend
```bash
(Development)
npm run dev

(Production)
npm run build 
npm start
```

#### 🟩 Frontend Admin Setup
```bash
cd frontend-admin
npm install
npm run dev
```

#### 🟧 Frontend User Setup (React Native App)
```bash
cd frontend-user
npm install
npm run dev
```
