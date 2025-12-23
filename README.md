# 🎥 Film Club Manager - Setup Guide

This guide will help you set up the project from scratch on a computer with nothing installed.

## 🛠️ Step 1: Install Prerequisites

Before downloading the code, you need to install the necessary tools.

### 1. Install Node.js
This allows you to run the JavaScript backend and frontend.
* Go to: [nodejs.org](https://nodejs.org/)
* Download the **LTS Version** (Recommended for most users).
* Run the installer and follow the default prompts (Next, Next, Finish).
* *Verification:* Open your terminal (Command Prompt or PowerShell) and type `node -v`. You should see a version number.

### 2. Install MySQL Server & Workbench
This is your database engine and the tool to manage it.
* Go to: [dev.mysql.com/downloads/installer](https://dev.mysql.com/downloads/installer/)
* Download the **MySQL Installer** (Web Community is fine).
* Run the installer. When asked what to install, choose **"Developer Default"** (this includes MySQL Server and MySQL Workbench).
* **Important during setup:**
    * It will ask you to set a **Root Password**. Write this down (e.g., `rootpassword`).
    * Keep the default port as `3306`.
* Finish the installation.

### 3. Install Git (Optional but Recommended)
* Go to: [git-scm.com](https://git-scm.com/)
* Download and install for your OS.

### 4. Install VS Code (Code Editor)
* Go to: [code.visualstudio.com](https://code.visualstudio.com/)
* Download and install.

---

## 🗄️ Step 2: Database Setup

The application will fail if the database and specific users do not exist.

1.  Open **MySQL Workbench**.
2.  Click on the "Local instance MySQL80" box to connect (enter the root password you created in Step 1).
3.  Look for the file `Dump.sql` (or the SQL script provided in the documentation) in the project folder.
4.  Copy the **entire SQL script content**.
5.  Paste it into the query window in MySQL Workbench.
6.  Click the **Lightning Bolt icon** ⚡ (Execute) in the toolbar.
    * *Result:* This will create the `FilmClubsAUThDB` database and create the required users (`app_admin`, `app_guest`, etc.).

---

## 📦 Step 3: Install Project Dependencies

You need to install the code libraries for both the frontend (client) and backend (server).

1.  Open **VS Code**.
2.  Open the project folder (File > Open Folder).
3.  Open a Terminal inside VS Code (Terminal > New Terminal).

### Backend Dependencies
Type the following commands in the terminal:
```bash
cd server
npm install
```

### Frontend Dependencies
Type the following commands:
```bash
cd ../client
npm install
```
---

## 🚀 Step 4: Running the Application

You need to run the Backend and Frontend in **two separate terminals**.

### 1. Start the Backend (API)
In your first terminal window, make sure you are in the server folder:
```bash
cd server
node index.js
```
* *Success Message:* You should see Connected to MySQL DB... and Server running on port 3001.

### 2. Start the Frontend (UI)
Open a **new** terminal (click the + button in VS Code terminal panel).
Make sure you are in the client folder:
```bash
cd client
npm start
```
* This will automatically open your web browser to http://localhost:3000.

---

## ✅ You are done!
Log in using one of the test accounts (e.g., alex / adminpswrd for Admin access).