// Placeholder for auth.js
// ============================================================
// 📁 js/auth.js - Authentication (Firebase + Worker API)
// ============================================================

let currentCaptcha = '';

function generateCaptcha() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';
    let captcha = '';
    for (let i = 0; i < 6; i++) {
        captcha += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return captcha;
}

function updateCaptchaDisplay() {
    const display = document.getElementById('captchaDisplay');
    if (!display) return;
    
    currentCaptcha = generateCaptcha();
    display.innerHTML = currentCaptcha.split('').map(char => 
        `<span style="display:inline-block; transform:rotate(${Math.random() * 30 - 15}deg); 
        margin:0 3px; font-size:24px; font-weight:bold; 
        color:hsl(${Math.random() * 360}, 80%, 55%); 
        text-shadow:1px 1px 2px rgba(0,0,0,0.3);
        font-family:monospace;">${char}</span>`
    ).join('');
}

document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        updateCaptchaDisplay();
        const refreshBtn = document.getElementById('refreshCaptcha');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                updateCaptchaDisplay();
                document.getElementById('captchaInput').value = '';
            });
        }
        registerForm.addEventListener('submit', handleRegister);
    }
    
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
});

async function handleRegister(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const country = document.getElementById('country').value;
    const captchaInput = document.getElementById('captchaInput').value.trim();
    const btn = document.getElementById('submitBtn');
    
    if (!email || !username || !password || !country) {
        showAlert('Please fill all fields!', 'error');
        return;
    }
    
    if (password.length < 6) {
        showAlert('Password must be 6+ characters!', 'error');
        return;
    }
    
    if (captchaInput.toUpperCase() !== currentCaptcha.toUpperCase()) {
        showAlert('❌ Invalid captcha!', 'error');
        updateCaptchaDisplay();
        document.getElementById('captchaInput').value = '';
        return;
    }
    
    btn.disabled = true;
    btn.textContent = '⏳ Processing...';
    
    try {
        // 1. Register with Firebase
        const firebaseUser = await firebase.auth().createUserWithEmailAndPassword(email, password);
        const userId = firebaseUser.user.uid;
        
        // 2. Save user to Worker API
        const result = await window.apiRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify({
                id: userId,
                username: username,
                email: email,
                password: password,
                country: country
            })
        });
        
        if (result && result.success) {
            localStorage.setItem('userId', userId);
            showAlert('✅ Account created!', 'success');
            setTimeout(() => {
                window.location.href = 'home.html';
            }, 1500);
        }
        
    } catch (error) {
        showAlert('Registration failed: ' + error.message, 'error');
        btn.disabled = false;
        btn.textContent = '✅ Create Account';
    }
}

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const btn = document.getElementById('loginBtn');
    
    if (!email || !password) {
        showAlert('Please enter email and password!', 'error');
        return;
    }
    
    btn.disabled = true;
    btn.textContent = '⏳ Logging in...';
    
    try {
        // 1. Login with Firebase
        const firebaseUser = await firebase.auth().signInWithEmailAndPassword(email, password);
        const userId = firebaseUser.user.uid;
        
        // 2. Get user from Worker API
        const result = await window.apiRequest(`/users/${userId}`);
        
        if (result && result.success) {
            localStorage.setItem('userId', userId);
            showAlert('✅ Login successful!', 'success');
            setTimeout(() => {
                window.location.href = 'home.html';
            }, 1000);
        }
        
    } catch (error) {
        showAlert('Login failed: ' + error.message, 'error');
        btn.disabled = false;
        btn.textContent = 'Login';
    }
}

// Google Login
document.addEventListener('DOMContentLoaded', function() {
    const googleBtn = document.getElementById('googleSignInBtn');
    if (googleBtn) {
        googleBtn.addEventListener('click', async function() {
            try {
                const user = await window.signInWithGoogle();
                const userId = user.uid;
                
                // Check if user exists in DB
                const result = await window.apiRequest(`/users/${userId}`);
                
                if (result && result.success) {
                    localStorage.setItem('userId', userId);
                    window.location.href = 'home.html';
                } else {
                    // Redirect to registration with email filled
                    window.location.href = 'register.html?email=' + encodeURIComponent(user.email);
                }
            } catch (error) {
                showAlert('Google login failed: ' + error.message, 'error');
            }
        });
    }
});