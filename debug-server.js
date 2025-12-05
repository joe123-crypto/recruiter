import dotenv from 'dotenv';
// import { GoogleGenAI } from '@google/generative-ai';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

console.log('Starting debug script...');

dotenv.config();

console.log('Environment variables loaded.');
console.log('VITE_GEMINI_API_KEY:', process.env.VITE_GEMINI_API_KEY ? 'Present' : 'Missing');
console.log('VITE_FIREBASE_API_KEY:', process.env.VITE_FIREBASE_API_KEY ? 'Present' : 'Missing');

try {
    const firebaseConfig = {
        apiKey: process.env.VITE_FIREBASE_API_KEY,
        authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.VITE_FIREBASE_APP_ID
    };

    console.log('Initializing Firebase...');
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    console.log('Firebase initialized successfully.');
} catch (error) {
    console.error('Firebase initialization failed:', error);
}

/*
try {
    console.log('Initializing GoogleGenAI...');
    const genAI = new GoogleGenAI(process.env.VITE_GEMINI_API_KEY || 'dummy_key');
    console.log('GoogleGenAI initialized successfully.');
} catch (error) {
    console.error('GoogleGenAI initialization failed:', error);
}
*/

console.log('Debug script completed.');
