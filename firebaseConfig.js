// firebaseConfig.js
const firebaseConfig = {
    apiKey: "AIzaSyBFjqOyfk0zpQZW4SVgtA232p9tFzeMNJc",
    authDomain: "ragaanewproject.firebaseapp.com",
    projectId: "ragaanewproject",
    storageBucket: "ragaanewproject.appspot.com",
    messagingSenderId: "643493605383",
    appId: "1:643493605383:web:a90e4c460dfe51bb17faa2",
    measurementId: "G-QJM49GMPT4"
  };
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

export default db; // Export db for use in other modules
