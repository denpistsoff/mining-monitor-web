// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB8oZorQEK1JQGaKAC3A_cQfbX6pnSQLjo",
  authDomain: "mining-monitor-api.firebaseapp.com",
  databaseURL: "https://mining-monitor-api-default-rtdb.firebaseio.com",
  projectId: "mining-monitor-api",
  storageBucket: "mining-monitor-api.firebasestorage.app",
  messagingSenderId: "235256547871",
  appId: "1:235256547871:web:39cfaaa791476bacb8a32a",
  measurementId: "G-X7P0QV1XGV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

