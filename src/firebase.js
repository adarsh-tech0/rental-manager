// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDZaHlGinQh0X0Osp39DKKTb3lcqvdJhXw",
  authDomain: "rental-manager-d47a3.firebaseapp.com",
  projectId: "rental-manager-d47a3",
  storageBucket: "rental-manager-d47a3.firebasestorage.app",
  messagingSenderId: "890340161149",
  appId: "1:890340161149:web:71cae0b385c142f0a62314"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);