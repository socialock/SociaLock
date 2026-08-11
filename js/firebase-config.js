// ============================================================
// 📁 js/firebase-config.js
// ============================================================

const firebaseConfig = {
    apiKey: "AIzaSyB7NgsszBItILY5KPzAhL4Z8h34aBl9L1g",
    authDomain: "socialock-c91dd.firebaseapp.com",
    projectId: "socialock-c91dd",
    storageBucket: "socialock-c91dd.firebasestorage.app",
    messagingSenderId: "840419654759",
    appId: "1:840419654759:web:11aae9ea013e8bf142e8c2",
    measurementId: "G-4K7R8Q3NRR"
};

// Firebase Initialize
try {
    firebase.initializeApp(firebaseConfig);
} catch (error) {
}

// Google Provider
const provider = new firebase.auth.GoogleAuthProvider();
provider.addScope('profile');
provider.addScope('email');
provider.setCustomParameters({ prompt: 'select_account' });

// Google Sign In Function
async function signInWithGoogle() {
    try {
        const result = await firebase.auth().signInWithPopup(provider);
        return result.user;
    } catch (error) {
        throw error;
    }
}

// Sign Out
async function signOutUser() {
    try {
        await firebase.auth().signOut();
        localStorage.removeItem('userId');
        localStorage.removeItem('token');
    } catch (error) {
    }
}

// Auth State Listener
function onAuthStateChanged(callback) {
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
        } else {
        }
        callback(user);
    });
}

// Export
window.signInWithGoogle = signInWithGoogle;
window.signOutUser = signOutUser;
window.onAuthStateChanged = onAuthStateChanged;
window.auth = firebase.auth();

