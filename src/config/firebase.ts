import { initializeApp } from 'firebase/app';
// @ts-ignore -- getReactNativePersistence exists at runtime via the RN bundle
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyANs5mAy753DSf4fL4pjTE2n9Qh5SGiYMM",
  authDomain: "favmusicalbums.firebaseapp.com",
  projectId: "favmusicalbums",
  storageBucket: "favmusicalbums.firebasestorage.app",
  messagingSenderId: "286182075135",
  appId: "1:286182075135:web:48b9f7651193d14e297aca",
  measurementId: "G-29MFE3DR17"
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const db = getFirestore(app);
