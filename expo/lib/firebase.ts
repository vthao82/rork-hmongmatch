import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBQqlH0RZbce5tBTNenN7PA4u3uEwfBaVQ",
  authDomain: "hmong-date.firebaseapp.com",
  projectId: "hmong-date",
  storageBucket: "hmong-date.firebasestorage.app",
  messagingSenderId: "1004199539174",
  appId: "1:1004199539174:android:71a011e1172a38b46de627",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
