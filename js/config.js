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
  const token = localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  // Prefer the signed JWT (issued on login/register) for authenticated
  // requests; fall back to the raw userId for back-compat.
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else if (userId) {
    headers['Authorization'] = `Bearer ${userId}`;
  }

  try {
    
    const response = await fetch(url, {
      ...options,
      headers,
      mode: 'cors',        // ✅ যোগ করুন
      credentials: 'omit'  // ✅ যোগ করুন
    });

    // Check if response is ok
    if (!response.ok) {
      const errorText = await response.text();
      
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
    return data;
    
  } catch (error) {
    
    if (error.message === 'Failed to fetch') {
      showAlert('Cannot connect to server. Please check your internet connection.', 'error');
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

  // Strip any leading keyboard emoji from the message; use FontAwesome icons instead.
  // eslint-disable-next-line no-control-regex
  const cleanMessage = String(message).replace(/^[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}]\s*/gu, '').trim();
  const icons = {
    success: 'fa-solid fa-circle-check',
    error: 'fa-solid fa-circle-exclamation',
    info: 'fa-solid fa-circle-info'
  };
  const iconClass = icons[type] || icons.info;

  const alert = document.createElement('div');
  alert.className = `custom-alert ${type}`;
  alert.innerHTML = `
    <i class="${iconClass}" style="flex-shrink:0;"></i>
    <span>${cleanMessage}</span>
    <button onclick="this.parentElement.remove()" style="background:none;border:none;color:white;margin-left:10px;cursor:pointer;font-size:16px;display:flex;"><i class="fa-solid fa-xmark"></i></button>
  `;
  alert.style.display = 'flex';
  alert.style.alignItems = 'center';
  alert.style.gap = '10px';
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
    
    const result = await apiRequest('/posts');
    if (result && result.success) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
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
    return true;
  } else if (userId) {
    return true;
  } else {
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


// Auto test connection on load
setTimeout(async () => {
  await testAPIConnection();
}, 2000);

// Check auth status
checkAuth();