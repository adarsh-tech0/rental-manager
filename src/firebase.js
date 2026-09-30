import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDZaHlGinQh0X0Osp39DKKTb3lcqvdJhXw",
  authDomain: "rental-manager-d47a3.firebaseapp.com",
  projectId: "rental-manager-d47a3",
  storageBucket: "rental-manager-d47a3.firebasestorage.app",
  messagingSenderId: "890340161149",
  appId: "1:890340161149:web:71cae0b385c142f0a62314"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
