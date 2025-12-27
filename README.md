# StudyTrack - Student Study Planner

A modern web application for students to manage their study schedules, track attendance, and plan their academic activities effectively.

## Features

- 📚 Study Timetable Generator
- 📊 Attendance Tracking
- 📝 Subject Management
- 🎯 Priority-based Study Planning
- 📱 Responsive Design
- 🌙 Modern UI/UX

## Tech Stack

- Frontend: HTML5, CSS3, JavaScript
- Backend: Firebase (Authentication & Cloud Firestore)
- Database: Cloud Firestore
- Deployment: Vercel / Firebase Hosting

## Prerequisites

Before deploying, make sure you have:

1. A [Firebase](https://firebase.google.com) account
2. A [Vercel](https://vercel.com) account (optional, for hosting)
3. [Git](https://git-scm.com/) installed on your machine

## Setup & Deployment

1. **Set up Firebase Project**

   - Go to [Firebase Console](https://console.firebase.google.com)
   - Create a new project
   - Enable **Authentication** (Email/Password sign-in method)
   - Enable **Cloud Firestore**
     - Start in **Test Mode** (for development) or **Production Mode** (requires security rules)
   
2. **Configure Firestore Rules**
   
   To allow authenticated users to read and write their own data, use these security rules in the Firebase Console:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```

3. **Update Configuration**

   - In Project Settings > General, create a new **Web App**
   - Copy the `firebaseConfig` object
   - Paste it into `js/firebase-config.js` replacing the existing config

## Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/studytrack.git
   cd studytrack
   ```

2. Open the project:
   - You can simply open `index.html` in your browser, or use a live server extension (like in VS Code).
   - Or install a local server:
   ```bash
   npm install -g http-server
   http-server
   ```

3. Open `http://localhost:8080` (or your local server URL)

## Security

- Database operations are secured by Firebase Security Rules
- Authentication is handled by Firebase Auth
- HTTPS is required for Firebase Authentication to work securely in production

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details