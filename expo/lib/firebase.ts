import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBQqlH0RZbce5tBTNenN7PA4u3uEwfBaVQ",
  authDomain: "hmong-date.firebaseapp.com",
  projectId: "hmong-date",
  storageBucket: "hmong-date.firebasestorage.app",
  messagingSenderId: "1004199539174",
  appId: "1:1004199539174:android:71a011e1172a38b46de627",
};

const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Firebase v11+ auto-detects React Native and uses AsyncStorage for
// persistence when @react-native-async-storage/async-storage is installed.
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
