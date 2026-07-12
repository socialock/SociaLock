// ============================================================
// 📁 js/config.js
// ============================================================

const SUPABASE_URL = 'https://mjuowfrzvgnqrazqnunr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qdW93ZnJ6dmducXJhenFudW5yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwNDY4MzgsImV4cCI6MjA5NTYyMjgzOH0.D9leYQRFsql9ONIsG4pPYdkQdWI_8SDL23wS8rlO7pk';

let supabaseClient = null;

function initSupabase() {
    try {
        if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
            supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log("✅ Supabase connected");
            return supabaseClient;
        } else {
            console.error("❌ Supabase library not loaded");
            return null;
        }
    } catch (error) {
        console.error("❌ Supabase error:", error);
        return null;
    }
}

// ===== গ্লোবাল ফাংশন =====
window.getSupabase = function() {
    if (!supabaseClient) {
        return initSupabase();
    }
    return supabaseClient;
};

window.showAlert = function(message, type = 'info') {
    const existing = document.querySelector('.custom-alert');
    if (existing) existing.remove();
    
    const alert = document.createElement('div');
    alert.className = `custom-alert ${type}`;
    alert.innerHTML = `${message}<button onclick="this.parentElement.remove()" style="background:none;border:none;color:white;margin-left:10px;cursor:pointer;font-size:18px;">✕</button>`;
    document.body.appendChild(alert);
    setTimeout(() => alert.remove(), 4000);
};

// Initialize on load
initSupabase();

console.log('🔧 Config loaded!');