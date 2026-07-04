# 🛡️ CitizenShield — Suspicious Activity Reporting System

A citizen-facing web portal that lets members of the public report suspicious activities to authorities. Reports are stored in **Firebase Firestore** (cloud database) and managed through a secure admin dashboard.

---

## 📁 Project Structure

```
web app/
├── index.html                   # Home / landing page
├── report.html                  # Public report submission form
├── login.html                   # Admin login page
├── admin.html                   # Admin dashboard (protected)
├── operating_manual.html        # System operating manual
├── script.js                    # All app logic (Firebase data layer)
├── style.css                    # All styles
├── firebase-config.js           # ⚠️  GITIGNORED — your real credentials
├── firebase-config.example.js   # ✅ Safe template — copy & rename
└── .gitignore
```

---

## 🚀 Getting Started

### 1. Clone / Download the project

```bash
git clone <your-repo-url>
cd "web app"
```

### 2. Configure Firebase credentials

The Firebase config is kept in [`script.js`](script.js) (which is listed in `.gitignore` so real keys never reach a public repo).

If you're setting up a fresh copy, open `script.js` and update the `firebaseConfig` block at the top with your own project values from:
> **Firebase Console** → Your Project → ⚙️ Project Settings → Your Apps → SDK Setup and Configuration

```js
const firebaseConfig = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT_ID.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT_ID.firebasestorage.app",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId:             "YOUR_APP_ID",
};
```

### 3. Set up Firestore Security Rules

In **Firebase Console** → Firestore Database → **Rules** tab, paste:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /reports/{id} {
      allow read, write: if true;
    }
  }
}
```

Click **Publish**. *(You can tighten these with Firebase Authentication later.)*

### 4. Run locally

> ⚠️ Do **not** open HTML files by double-clicking — the `file://` protocol blocks Firebase requests. Use a local HTTP server.

**Option A — VS Code Live Server** *(recommended)*
1. Install the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension
2. Right-click `index.html` → **Open with Live Server**
3. App opens at `http://127.0.0.1:5500`

**Option B — Python**
```bash
python -m http.server 8080
# Open: http://localhost:8080
```

**Option C — Node.js**
```bash
npx serve .
# Open the URL shown in the terminal
```

---

## 🔐 Security: About Firebase API Keys

Firebase API keys for web apps are **not traditional secrets** — they identify your project but access is controlled by **Firestore Security Rules** on the server side.

However, keeping keys out of public repositories is still best practice. The `.gitignore` file in this project excludes `script.js` from being committed to prevent accidental exposure.

| File | Committed? | Contains |
|---|---|---|
| `script.js` | ❌ No (gitignored) | App logic + Firebase config |
| `firebase-config.example.js` | ✅ Yes | Placeholder template only |

---

## 📖 Pages & Usage

| Page | Access | Description |
|---|---|---|
| `index.html` | Public | Landing page with project info |
| `report.html` | Public | Submit a suspicious activity report |
| `login.html` | Admin | Login portal |
| `admin.html` | Admin only | View, filter, and manage all reports |
| `operating_manual.html` | Public | Detailed operating instructions |

### Admin Credentials (Demo)
```
Username : admin
Password : admin123
```

---

## ✨ Features

- **Firebase Firestore** — real-time cloud database, no local server needed
- **Auto-seeding** — demo reports are inserted automatically on first run if the database is empty
- **Report submission** — with image upload (base64), drag & drop, inline validation
- **Admin dashboard** — filter by status, search by name/location, update or delete reports
- **Status workflow** — `Pending` → `Verified` → `Resolved`
- **Toast notifications** — real-time feedback on all actions
- **Responsive design** — works on mobile, tablet, and desktop
- **XSS protection** — all user content is HTML-escaped before rendering

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, Vanilla CSS, Vanilla JS (ES2020) |
| Icons | [Phosphor Icons](https://phosphoricons.com/) (CDN) |
| Database | [Firebase Firestore](https://firebase.google.com/docs/firestore) |
| Firebase SDK | v10 Compat (CDN) |
| Hosting | Any static host (GitHub Pages, Firebase Hosting, Netlify, etc.) |

---

## 🌐 Deploying to Firebase Hosting *(optional)*

```bash
npm install -g firebase-tools
firebase login
firebase init hosting    # set public directory to "." 
firebase deploy
```

---

## 📝 Academic Project Note

This project was developed as an academic submission for the **National Security & Defence Technologies** course.

> © 2026 CitizenShield — Suspicious Activity Reporting System
