// firebaseConfig.js
const firebaseConfig = {
    apiKey: "AIzaSyAdRdy9EIlf9cqumCJDKmT-LBo-0buyxfE",
    authDomain: "ragaa2.firebaseapp.com",
    projectId: "ragaa2",
    storageBucket: "ragaa2.appspot.com",
    messagingSenderId: "1043709314283",
    appId: "1:1043709314283:web:bf7e3fc81be7540277eaae",
    measurementId: "G-VPN7L61FZT"
  };
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

export default db; // Export db for use in other modules
