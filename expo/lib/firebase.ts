import { initializeApp, getApps } from "firebase/app";
import { initializeAuth, getAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyBQqlH0RZbce5tBTNenN7PA4u3uEwfBaVQ",
  authDomain: "hmong-date.firebaseapp.com",
  projectId: "hmong-date",
  storageBucket: "hmong-date.firebasestorage.app",
  messagingSenderId: "1004199539174",
  appId: "1:1004199539174:android:71a011e1172a38b46de627",
};

const isNew = getApps().length === 0;
const app = isNew ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = isNew
  ? initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) })
  : getAuth(app);
