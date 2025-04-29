const firebaseConfig = {
    apiKey: "AIzaSyCffcwlZUDTthmRFCAYOxGYHY9-cQnS28w",
    authDomain: "sugestion-cartilha.firebaseapp.com",
    projectId: "sugestion-cartilha",
    storageBucket: "sugestion-cartilha.firebasestorage.app",
    messagingSenderId: "930038473929",
    appId: "1:930038473929:web:1a0155f231b5f10f2a9918",
    measurementId: "G-GLZZ22M774"
  };
  
  // Inicializa o Firebase
  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();
  