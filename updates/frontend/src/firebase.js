import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBapGQTSrucywaz1Y1jc1CJUJf6MsU53vA",
  authDomain: "netsecproject-6e610.firebaseapp.com",
  projectId: "netsecproject-6e610",
  storageBucket: "netsecproject-6e610.firebasestorage.app",
  messagingSenderId: "184871639843",
  appId: "1:184871639843:web:dcc53a5342697b464bca96",
  measurementId: "G-RLFW5PXMQ8"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };