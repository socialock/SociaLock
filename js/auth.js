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
    // রেজিস্ট্রেশন ফর্ম
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
    
    // লগইন ফর্ম
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
        showAlert('সব তথ্য পূরণ করুন!', 'error');
        return;
    }
    
    if (password.length < 6) {
        showAlert('পাসওয়ার্ড ৬+ অক্ষর হতে হবে!', 'error');
        return;
    }
    
    if (captchaInput.toUpperCase() !== currentCaptcha.toUpperCase()) {
        showAlert('❌ ক্যাপচা ভুল!', 'error');
        updateCaptchaDisplay();
        document.getElementById('captchaInput').value = '';
        return;
    }
    
    btn.disabled = true;
    btn.textContent = '⏳ প্রসেসিং...';
    
    const supabase = window.getSupabase();
    if (!supabase) {
        showAlert('Supabase সংযোগ নেই!', 'error');
        btn.disabled = false;
        btn.textContent = '✅ ক্রিয়েট অ্যাকাউন্ট';
        return;
    }
    
    try {
        // ইউজারনেম ইউনিক চেক
        const { data: existingUser } = await supabase
            .from('users')
            .select('username')
            .eq('username', username)
            .maybeSingle();
        
        if (existingUser) {
            showAlert('এই ইউজারনেম নেওয়া হয়েছে!', 'error');
            btn.disabled = false;
            btn.textContent = '✅ ক্রিয়েট অ্যাকাউন্ট';
            return;
        }
        
        // ইমেইল ইউনিক চেক
        const { data: existingEmail } = await supabase
            .from('users')
            .select('email')
            .eq('email', email)
            .maybeSingle();
        
        if (existingEmail) {
            showAlert('এই ইমেইল রেজিস্টার করা হয়েছে!', 'error');
            btn.disabled = false;
            btn.textContent = '✅ ক্রিয়েট অ্যাকাউন্ট';
            return;
        }
        
        // ইউজার তৈরি
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: { username, country }
            }
        });
        
        if (signUpError) {
            showAlert('রেজিস্ট্রেশন ব্যর্থ: ' + signUpError.message, 'error');
            btn.disabled = false;
            btn.textContent = '✅ ক্রিয়েট অ্যাকাউন্ট';
            return;
        }
        
        if (authData.user) {
            await supabase.from('users').insert({
                id: authData.user.id,
                username: username,
                email: email,
                country: country,
                created_at: new Date().toISOString()
            });
            
            showAlert('✅ অ্যাকাউন্ট তৈরি হয়েছে! লগইন করুন', 'success');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        }
        
    } catch (error) {
        showAlert('ত্রুটি: ' + error.message, 'error');
        btn.disabled = false;
        btn.textContent = '✅ ক্রিয়েট অ্যাকাউন্ট';
    }
}

async function handleLogin(e) {
    e.preventDefault();
    
    const identifier = document.getElementById('loginIdentifier').value.trim();
    const password = document.getElementById('loginPassword').value;
    const btn = document.getElementById('loginBtn');
    
    if (!identifier || !password) {
        showAlert('ইউজারনেম/ইমেইল এবং পাসওয়ার্ড দিন!', 'error');
        return;
    }
    
    btn.disabled = true;
    btn.textContent = '⏳ লগইন হচ্ছে...';
    
    const supabase = window.getSupabase();
    if (!supabase) {
        showAlert('Supabase সংযোগ নেই!', 'error');
        btn.disabled = false;
        btn.textContent = 'লগইন';
        return;
    }
    
    try {
        let email = identifier;
        
        if (!identifier.includes('@')) {
            const { data: user } = await supabase
                .from('users')
                .select('email')
                .eq('username', identifier)
                .maybeSingle();
            
            if (user) {
                email = user.email;
            } else {
                showAlert('ইউজারনেম পাওয়া যায়নি!', 'error');
                btn.disabled = false;
                btn.textContent = 'লগইন';
                return;
            }
        }
        
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) {
            showAlert('❌ ভুল তথ্য!', 'error');
            btn.disabled = false;
            btn.textContent = 'লগইন';
            return;
        }
        
        if (data.user) {
            localStorage.setItem('userId', data.user.id);
            showAlert('✅ লগইন সফল!', 'success');
            setTimeout(() => {
                window.location.href = 'home.html';
            }, 1000);
        }
        
    } catch (error) {
        showAlert('লগইন ব্যর্থ!', 'error');
        btn.disabled = false;
        btn.textContent = 'লগইন';
    }
}