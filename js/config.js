// ============================================================
// 📁 js/config.js - API Configuration (FULL UPDATED)
// ============================================================

// ✅ সঠিক URL - আপনার Cloudflare Worker URL
const API_BASE_URL = 'https://bitter-lab-e0e4.socialockapi.workers.dev/api';

// ============================================================
// API REQUEST FUNCTION - ✅ CORS FIXED
// ============================================================
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const userId = localStorage.getItem('userId');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (userId) {
    headers['Authorization'] = `Bearer ${userId}`;
  }

  try {
    console.log('📤 API Request:', url, options.method || 'GET');
    
    const response = await fetch(url, {
      ...options,
      headers,
      mode: 'cors',        // ✅ যোগ করুন
      credentials: 'omit'  // ✅ যোগ করুন
    });

    // Check if response is ok
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', response.status, errorText);
      
      // Try to parse as JSON
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.error) {
          showAlert(errorData.error, 'error');
        }
      } catch (e) {
        showAlert(`Server error (${response.status})`, 'error');
      }
      return null;
    }

    const data = await response.json();
    console.log('📥 API Response:', data);
    return data;
    
  } catch (error) {
    console.error('❌ API Request failed:', error);
    
    if (error.message === 'Failed to fetch') {
      showAlert('⚠️ Cannot connect to server. Please check your internet connection.', 'error');
      console.error('🔍 Possible reasons:');
      console.error('1. Worker is not deployed');
      console.error('2. CORS not configured');
      console.error('3. URL is incorrect:', API_BASE_URL);
      console.error('4. Internet connection issue');
    } else {
      showAlert('Network error. Please try again.', 'error');
    }
    return null;
  }
}

// ============================================================
// ALERT FUNCTION
// ============================================================
function showAlert(message, type = 'info') {
  const existing = document.querySelector('.custom-alert');
  if (existing) existing.remove();
  
  const alert = document.createElement('div');
  alert.className = `custom-alert ${type}`;
  alert.innerHTML = `
    <span>${message}</span>
    <button onclick="this.parentElement.remove()" style="background:none;border:none;color:white;margin-left:10px;cursor:pointer;font-size:18px;">✕</button>
  `;
  document.body.appendChild(alert);
  setTimeout(() => alert.remove(), 4000);
}

// ============================================================
// ESCAPE HTML (XSS Prevention)
// ============================================================
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ============================================================
// TIME AGO
// ============================================================
function timeAgo(date) {
  if (!date) return 'Just now';
  try {
    const now = new Date();
    const past = new Date(date);
    const diff = Math.floor((now - past) / 1000);
    if (diff < 5) return 'Just now';
    if (diff < 60) return diff + 's ago';
    const m = Math.floor(diff / 60);
    if (m < 60) return m + 'm ago';
    const h = Math.floor(m / 60);
    if (h < 24) return h + 'h ago';
    const d = Math.floor(h / 24);
    if (d < 7) return d + 'd ago';
    if (d < 30) return Math.floor(d / 7) + 'w ago';
    if (d < 365) return Math.floor(d / 30) + 'mo ago';
    return Math.floor(d / 365) + 'y ago';
  } catch (e) {
    return 'Just now';
  }
}

// ============================================================
// TEST API CONNECTION
// ============================================================
async function testAPIConnection() {
  try {
    console.log('🔍 Testing API connection...');
    console.log('📍 URL:', API_BASE_URL);
    
    const result = await apiRequest('/posts');
    if (result && result.success) {
      console.log('✅ API connection successful!');
      console.log('📊 Posts count:', result.data?.length || 0);
      return true;
    } else {
      console.error('❌ API connection failed!');
      return false;
    }
  } catch (error) {
    console.error('❌ API test failed:', error);
    return false;
  }
}

// ============================================================
// CHECK AUTH STATUS
// ============================================================
function checkAuth() {
  const userId = localStorage.getItem('userId');
  const token = localStorage.getItem('token');
  
  if (userId && token) {
    console.log('✅ User authenticated:', userId);
    return true;
  } else if (userId) {
    console.log('⚠️ User ID found but no token');
    return true;
  } else {
    console.log('❌ No user authenticated');
    return false;
  }
}

// ============================================================
// GET AUTH HEADERS
// ============================================================
function getAuthHeaders() {
  const userId = localStorage.getItem('userId');
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (userId) {
    headers['Authorization'] = `Bearer ${userId}`;
  }
  
  if (token) {
    headers['X-Auth-Token'] = token;
  }
  
  return headers;
}

// ============================================================
// EXPORT
// ============================================================
window.apiRequest = apiRequest;
window.showAlert = showAlert;
window.escapeHtml = escapeHtml;
window.timeAgo = timeAgo;
window.API_BASE_URL = API_BASE_URL;
window.testAPIConnection = testAPIConnection;
window.checkAuth = checkAuth;
window.getAuthHeaders = getAuthHeaders;

console.log('✅ API Config loaded!', API_BASE_URL);
console.log('🔍 API Base URL:', API_BASE_URL);

// Auto test connection on load
setTimeout(async () => {
  await testAPIConnection();
}, 2000);

// Check auth status
checkAuth();