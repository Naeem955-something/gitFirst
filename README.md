# MediScript - Digital Medical Prescription Management System

MediScript is a comprehensive digital platform designed to streamline the medical prescription process by replacing outdated, paper-based workflows with a modern,
web-based solution. Built using a full-stack architecture, the system allows doctors to create prescriptions, patients to access them, 
and administrators to manage the overall system — securely and efficiently.

---

## 📌 Table of Contents

- [🎯 Features](#-features)
- [🚀 Technologies Used](#-technologies-used)
- [🛠 Installation](#-installation)
- [🖥 System Architecture](#-system-architecture)
- [🧪 Testing & Security](#-testing--security)
- [📚 Future Enhancements](#-future-enhancements)
- [👨‍💻 Authors](#-authors)
- [📄 License](#-license)

---

## 🎯 Features

### 👨‍⚕️ For Doctors:
- Create, edit, and manage digital prescriptions.
- View patient history and drug records.
- Integrated drug inventory.
- Apply and get verified for system access.
- Access "My Patients" list and manage consultations.

### 🧑‍⚕️ For Patients:
- Secure portal to view and download prescriptions.
- Request medication refills.
- View doctor list with reviews and ratings.
- Submit doctor reviews and feedback.

### 🧑‍💼 For Administrators:
- Approve or reject doctor applications.
- Manage the medicine inventory with batch and expiry.
- Approve refill requests.
- Receive and manage issue reports from users.

### 🌐 Core Functionalities:
- Role-based access: Admin, Doctor, Patient.
- PDF generation of prescriptions using Puppeteer.
- Responsive and mobile-friendly UI (Tailwind CSS).
- Secure file upload (e.g., licenses, profile images).
- Real-time email notifications (via Nodemailer).
- Medicine expiry tracking and alerts.

---

## 🚀 Technologies Used

### Frontend:
- HTML5, CSS3, JavaScript
- Tailwind CSS, DaisyUI
- Font Awesome Icons

### Backend:
- Node.js, Express.js
- MySQL Database
- Multer (File uploads)
- Puppeteer (PDF generation)
- Nodemailer (Email service)

### Tools:
- Git & GitHub for version control
- VS Code as IDE
- MySQL Workbench for DB management
- Postman for API testing

---

## 🛠 Installation
1.Install dependencies:
cd mediscript
npm install

2.Set up the MySQL database:
Import the provided SQL schema into MySQL.
Configure DB credentials in .env file.

3.Run the server:
npm start



🖥 System Architecture
1.Frontend: HTML + Tailwind CSS for clean UI
2.Backend: Node.js with Express.js handling APIs
3.Database: MySQL with relational schema
4.Architecture: Three-tier (UI, Business Logic, DB)

🧪 Testing & Security
Manual testing across all user roles and use cases
File upload validations and sanitization
Role-based access control (RBAC)
SQL Injection protection with parameterized queries
Input validation and session management

👨‍💻 Authors
Uzzal Das – 011 231 0198
Sadman Biazid Arnob – 011 231 0405
Mohammad Naeem Mollah – 011 231 0202

Developed as part of CSE 3522 - Database Management System Lab
United International University
Date of Submission: 28 June 2025







