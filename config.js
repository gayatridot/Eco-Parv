// config.js — Firebase configuration
// IMPORTANT: This file is listed in .gitignore and will NOT be pushed to GitHub.
// Replace all placeholder values below with your real Firebase project credentials.
// Get them from: Firebase Console → Project Settings → Your Apps → Web App

// Helper to safely get env vars without throwing when `process` is undefined
const getEnv = (key) =>
    typeof process !== "undefined" && process.env && process.env[key]
        ? process.env[key]
        : "";

export const firebaseConfig = {
    // Next.js replaces these at build time; they will be undefined only if the env vars are missing.
    apiKey: getEnv("NEXT_PUBLIC_FIREBASE_API_KEY"),
    authDomain: getEnv("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"),
    projectId: getEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID"),
    storageBucket: getEnv("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"),
    messagingSenderId: getEnv("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"),
    appId: getEnv("NEXT_PUBLIC_FIREBASE_APP_ID")
};
