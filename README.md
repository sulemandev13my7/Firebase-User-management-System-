# Firebase User Management System 
# CRUD + sign-up / login System

## Setup

1. Create a Firebase project at https://console.firebase.google.com/
2. Enable Authentication with the Email/Password provider.
3. Enable Firestore Database.
4. Open [app.js](app.js) and replace the placeholder Firebase config values with your own project settings.
5. Open [index.html](index.html) in a browser or serve the folder with a simple static server.

## Notes

- Authentication is handled with Firebase Auth.
- User profile records are stored in the Firestore collection named `users`.
- The app uses localStorage to preserve the logged-in UI state across refreshes.
