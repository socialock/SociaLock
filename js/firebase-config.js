// ============================================================
// 📁 js/firebase-config.js
// Firebase Configuration - Google Login
// ============================================================

// ============================================================
// 1. YOUR FIREBASE CONFIG (socialock-c91dd)
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

// ============================================================
// 2. FIREBASE INITIALIZE (Modular SDK - CDN Version)
// ============================================================
// Firebase CDN (compat) ব্যবহার করছি, তাই এইভাবে initialize করতে হবে
firebase.initializeApp(firebaseConfig);

// ============================================================
// 3. AUTH REFERENCES
// ============================================================
const auth = firebase.auth();
const provider = new firebase.auth.GoogleAuthProvider();

// ============================================================
// 4. GOOGLE SIGN-IN FUNCTION
// ============================================================
async function signInWithGoogle() {
    try {
        const result = await auth.signInWithPopup(provider);
        const user = result.user;
        console.log('✅ Google Sign-In Successful:', user);
        return user;
    } catch (error) {
        console.error('❌ Google Sign-In Error:', error);
        throw error;
    }
}

// ============================================================
// 5. SIGN-OUT FUNCTION
// ============================================================
async function signOutUser() {
    try {
        await auth.signOut();
        console.log('✅ User signed out');
    } catch (error) {
        console.error('❌ Sign-out Error:', error);
    }
}

// ============================================================
// 6. AUTH STATE LISTENER
// ============================================================
function onAuthStateChanged(callback) {
    auth.onAuthStateChanged((user) => {
        if (user) {
            console.log('✅ User is signed in:', user.email);
        } else {
            console.log('❌ User is signed out');
        }
        callback(user);
    });
}

// ============================================================
// 7. EXPORT FUNCTIONS (Global)
// ============================================================
window.signInWithGoogle = signInWithGoogle;
window.signOutUser = signOutUser;
window.onAuthStateChanged = onAuthStateChanged;
window.auth = auth;

console.log('🔥 Firebase config loaded successfully!');
console.log('📱 Project ID:', firebaseConfig.projectId);