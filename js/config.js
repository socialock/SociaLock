/*
 * SociaLock
 * Copyright © 2026 SociaLock. All Rights Reserved.
 *
 * Unauthorized copying, reproduction, modification, or redistribution
 * of this source code is prohibited without prior written permission.
 */

// ============================================================
// 📁 js/config.js - API Configuration (FULL UPDATED)
// ============================================================

// ✅ Correct URL - your Cloudflare Worker URL
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
      mode: 'cors',        // ✅ Add this
      credentials: 'omit'  // ✅ Add this
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
// 🔒 STABLE REFERENCES (some pages re-declare apiRequest/showAlert
// with weaker local versions, e.g. tools.html — this shadows the
// global functions because plain <script> tags share one global
// scope. Capturing them here, right after they're first defined,
// keeps the shared widgets below always using the real ones with
// full auth-token support and error reporting.)
// ============================================================
const coreApiRequest = apiRequest;
const coreShowAlert = showAlert;

// ============================================================
// 🔗 CUSTOM SHARE SHEET (Copy Link + social apps)
// Used across Home (posts), Post view, Tools, and Profile.
// ============================================================
const SHARE_CHANNELS = [
  { name: 'WhatsApp', icon: 'fa-brands fa-whatsapp', color: '#25D366', link: (u, t) => `https://api.whatsapp.com/send?text=${t}%20${u}` },
  { name: 'Facebook', icon: 'fa-brands fa-facebook', color: '#1877F2', link: (u) => `https://www.facebook.com/sharer/sharer.php?u=${u}` },
  { name: 'Messenger', icon: 'fa-brands fa-facebook-messenger', color: '#00B2FF', link: (u) => `https://www.facebook.com/dialog/send?link=${u}&app_id=0&redirect_uri=${u}` },
  { name: 'Telegram', icon: 'fa-brands fa-telegram', color: '#26A5E4', link: (u, t) => `https://t.me/share/url?url=${u}&text=${t}` },
  { name: 'X', icon: 'fa-brands fa-x-twitter', color: '#111111', link: (u, t) => `https://twitter.com/intent/tweet?text=${t}&url=${u}` },
  { name: 'Email', icon: 'fa-solid fa-envelope', color: '#6b7280', link: (u, t, title) => `mailto:?subject=${title}&body=${t}%20${u}` },
  { name: 'SMS', icon: 'fa-solid fa-comment-sms', color: '#22c55e', link: (u, t) => `sms:?body=${t}%20${u}` }
];

function ensureShareSheet() {
  if (document.getElementById('customShareSheet')) return;

  if (!document.getElementById('shareSheetStyles')) {
    const style = document.createElement('style');
    style.id = 'shareSheetStyles';
    style.textContent = `
      .ssheet-overlay{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:99999;display:none;align-items:flex-end;justify-content:center;backdrop-filter:blur(4px);}
      .ssheet-overlay.show{display:flex;}
      @media (min-width:600px){.ssheet-overlay{align-items:center;}}
      .ssheet{background:#242526;border:1px solid #3a3b3c;border-radius:18px 18px 0 0;width:100%;max-width:420px;padding:16px 18px 22px;box-shadow:0 -8px 30px rgba(0,0,0,.5);animation:ssheetUp .2s ease;box-sizing:border-box;}
      @media (min-width:600px){.ssheet{border-radius:18px;}}
      @keyframes ssheetUp{from{transform:translateY(24px);opacity:0;}to{transform:translateY(0);opacity:1;}}
      .ssheet-handle{width:40px;height:4px;background:#3a3b3c;border-radius:2px;margin:0 auto 14px;}
      .ssheet-title{font-size:1.05rem;font-weight:700;color:#e4e6eb;margin-bottom:14px;text-align:center;}
      .ssheet-linkrow{display:flex;gap:8px;background:#18191a;border:1px solid #3a3b3c;border-radius:10px;padding:6px 6px 6px 12px;align-items:center;margin-bottom:16px;}
      .ssheet-linkrow input{flex:1;background:transparent;border:none;outline:none;color:#b0b3b8;font-size:.85rem;min-width:0;}
      .ssheet-linkrow button{background:#1877f2;color:#fff;border:none;border-radius:8px;padding:8px 14px;font-weight:600;font-size:.85rem;cursor:pointer;display:flex;align-items:center;gap:6px;white-space:nowrap;}
      .ssheet-linkrow button:hover{background:#166fe0;}
      .ssheet-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px 6px;margin-bottom:18px;max-height:220px;overflow-y:auto;}
      .ssheet-channel{display:flex;flex-direction:column;align-items:center;gap:6px;text-decoration:none;cursor:pointer;}
      .ssheet-channel-icon{width:50px;height:50px;border-radius:50%;background:var(--ch-color,#3a3b3c);display:flex;align-items:center;justify-content:center;font-size:1.3rem;color:#fff;transition:.15s;}
      .ssheet-channel:active .ssheet-channel-icon{transform:scale(.92);}
      .ssheet-channel-label{font-size:.72rem;color:#b0b3b8;text-align:center;}
      .ssheet-cancel{width:100%;background:#3a3b3c;color:#e4e6eb;border:none;border-radius:10px;padding:12px;font-weight:600;font-size:.9rem;cursor:pointer;}
      .ssheet-cancel:hover{background:#4a4b4c;}
    `;
    document.head.appendChild(style);
  }

  const wrap = document.createElement('div');
  wrap.id = 'customShareSheet';
  wrap.className = 'ssheet-overlay';
  wrap.innerHTML = `
    <div class="ssheet">
      <div class="ssheet-handle"></div>
      <div class="ssheet-title"><i class="fa-solid fa-share-nodes"></i> Share</div>
      <div class="ssheet-linkrow">
        <input type="text" id="shareSheetUrlInput" readonly>
        <button type="button" id="shareSheetCopyBtn"><i class="fa-solid fa-copy"></i> Copy</button>
      </div>
      <div class="ssheet-grid" id="shareSheetGrid"></div>
      <button type="button" class="ssheet-cancel" id="shareSheetCancelBtn">Cancel</button>
    </div>
  `;
  document.body.appendChild(wrap);

  wrap.addEventListener('click', (e) => { if (e.target === wrap) closeShareSheet(); });
  document.getElementById('shareSheetCancelBtn').addEventListener('click', closeShareSheet);
  document.getElementById('shareSheetCopyBtn').addEventListener('click', () => {
    const input = document.getElementById('shareSheetUrlInput');
    const finish = () => { coreShowAlert('✅ Link copied!', 'success'); closeShareSheet(); };
    if (navigator.clipboard) {
      navigator.clipboard.writeText(input.value).then(finish).catch(() => {
        input.removeAttribute('readonly'); input.select(); document.execCommand('copy'); input.setAttribute('readonly', 'true'); finish();
      });
    } else {
      input.removeAttribute('readonly'); input.select(); document.execCommand('copy'); input.setAttribute('readonly', 'true'); finish();
    }
  });
}

function closeShareSheet() {
  const el = document.getElementById('customShareSheet');
  if (el) el.classList.remove('show');
}

function openShareSheet(opts) {
  opts = opts || {};
  const url = opts.url;
  const title = opts.title || 'SociaLock';
  const text = opts.text || title;
  if (!url) return;

  ensureShareSheet();
  document.getElementById('shareSheetUrlInput').value = url;

  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(text);
  const encodedTitle = encodeURIComponent(title);

  const grid = document.getElementById('shareSheetGrid');
  let channelsHtml = SHARE_CHANNELS.map(c => `
    <a class="ssheet-channel" href="${c.link(encodedUrl, encodedText, encodedTitle)}" target="_blank" rel="noopener noreferrer" style="--ch-color:${c.color}">
      <span class="ssheet-channel-icon"><i class="${c.icon}"></i></span>
      <span class="ssheet-channel-label">${c.name}</span>
    </a>
  `).join('');

  if (navigator.share) {
    channelsHtml += `
      <a class="ssheet-channel" data-more="1" style="--ch-color:#8b98a8">
        <span class="ssheet-channel-icon"><i class="fa-solid fa-ellipsis"></i></span>
        <span class="ssheet-channel-label">More</span>
      </a>
    `;
  }

  grid.innerHTML = channelsHtml;

  const moreBtn = grid.querySelector('[data-more="1"]');
  if (moreBtn) {
    moreBtn.addEventListener('click', () => {
      closeShareSheet();
      navigator.share({ title, text, url }).catch(() => {});
    });
  }
  grid.querySelectorAll('.ssheet-channel:not([data-more])').forEach(el => {
    el.addEventListener('click', () => { setTimeout(closeShareSheet, 150); });
  });

  document.getElementById('customShareSheet').classList.add('show');
}

// ============================================================
// 🚩 CUSTOM REPORT MODAL (dropdown reason + optional details)
// Used across Home (posts), Tools, and Profile (users).
// ============================================================
const REPORT_REASONS = [
  { value: 'spam', label: 'Spam' },
  { value: 'harassment', label: 'Harassment or bullying' },
  { value: 'hate_speech', label: 'Hate speech' },
  { value: 'nudity_or_sexual_content', label: 'Nudity or sexual content' },
  { value: 'violence', label: 'Violence' },
  { value: 'false_information', label: 'False information' },
  { value: 'impersonation', label: 'Impersonation' },
  { value: 'other', label: 'Other' }
];

function ensureReportModal() {
  if (document.getElementById('customReportModal')) return;

  if (!document.getElementById('reportModalStyles')) {
    const style = document.createElement('style');
    style.id = 'reportModalStyles';
    style.textContent = `
      .rmodal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:99999;display:none;align-items:center;justify-content:center;backdrop-filter:blur(4px);padding:16px;box-sizing:border-box;}
      .rmodal-overlay.show{display:flex;}
      .rmodal{background:#242526;border:1px solid #3a3b3c;border-radius:16px;padding:24px 22px 20px;max-width:380px;width:100%;box-shadow:0 8px 30px rgba(0,0,0,.5);box-sizing:border-box;}
      .rmodal-title{display:flex;align-items:center;gap:8px;font-size:1.1rem;font-weight:700;color:#e4e6eb;margin-bottom:6px;}
      .rmodal-title i{color:#e94560;}
      .rmodal-sub{font-size:.85rem;color:#b0b3b8;margin-bottom:16px;line-height:1.4;}
      .rmodal-label{display:block;font-size:.75rem;font-weight:600;color:#b0b3b8;margin-bottom:6px;text-transform:uppercase;letter-spacing:.3px;}
      .rmodal-select,.rmodal-textarea{width:100%;background:#18191a;border:1px solid #3a3b3c;border-radius:10px;color:#e4e6eb;padding:10px 12px;font-size:.9rem;margin-bottom:14px;outline:none;font-family:inherit;resize:vertical;box-sizing:border-box;}
      .rmodal-select:focus,.rmodal-textarea:focus{border-color:#1877f2;}
      .rmodal-actions{display:flex;gap:10px;justify-content:flex-end;margin-top:4px;}
      .rmodal-actions button{padding:9px 20px;border:none;border-radius:20px;font-weight:600;font-size:.88rem;cursor:pointer;display:flex;align-items:center;gap:6px;transition:.15s;}
      .rmodal-cancel{background:#3a3b3c;color:#b0b3b8;}
      .rmodal-cancel:hover{background:#4a4b4c;}
      .rmodal-submit{background:#e94560;color:#fff;}
      .rmodal-submit:hover{background:#c62828;}
      .rmodal-submit:disabled{opacity:.6;cursor:not-allowed;}
    `;
    document.head.appendChild(style);
  }

  const wrap = document.createElement('div');
  wrap.id = 'customReportModal';
  wrap.className = 'rmodal-overlay';
  wrap.innerHTML = `
    <div class="rmodal">
      <div class="rmodal-title"><i class="fa-solid fa-flag"></i> <span id="reportModalTitleText">Report</span></div>
      <div class="rmodal-sub">Select the reason that best describes the issue. Your report is anonymous.</div>
      <label class="rmodal-label" for="reportReasonSelect">Reason</label>
      <select class="rmodal-select" id="reportReasonSelect">
        ${REPORT_REASONS.map(r => `<option value="${r.value}">${r.label}</option>`).join('')}
      </select>
      <label class="rmodal-label" for="reportDetailsInput">Additional details (optional)</label>
      <textarea class="rmodal-textarea" id="reportDetailsInput" rows="3" placeholder="Add any extra context..."></textarea>
      <div class="rmodal-actions">
        <button type="button" class="rmodal-cancel" id="reportModalCancelBtn"><i class="fa-solid fa-xmark"></i> Cancel</button>
        <button type="button" class="rmodal-submit" id="reportModalSubmitBtn"><i class="fa-solid fa-paper-plane"></i> Submit</button>
      </div>
    </div>
  `;
  document.body.appendChild(wrap);

  wrap.addEventListener('click', (e) => { if (e.target === wrap) closeReportModal(); });
  document.getElementById('reportModalCancelBtn').addEventListener('click', closeReportModal);
}

function closeReportModal() {
  const el = document.getElementById('customReportModal');
  if (el) el.classList.remove('show');
}

function openReportModal(opts) {
  opts = opts || {};
  const targetType = opts.targetType;
  const targetId = opts.targetId;
  const itemLabel = opts.itemLabel || targetType || 'content';

  const userId = localStorage.getItem('userId');
  if (!userId) {
    coreShowAlert('Please login first!', 'error');
    return;
  }
  if (!targetType || !targetId) return;

  ensureReportModal();
  document.getElementById('reportModalTitleText').textContent = `Report ${itemLabel}`;
  document.getElementById('reportReasonSelect').value = 'spam';
  document.getElementById('reportDetailsInput').value = '';

  // Replace submit button to clear any previously-bound listener
  const oldSubmitBtn = document.getElementById('reportModalSubmitBtn');
  const submitBtn = oldSubmitBtn.cloneNode(true);
  oldSubmitBtn.parentNode.replaceChild(submitBtn, oldSubmitBtn);

  submitBtn.addEventListener('click', async () => {
    const reason = document.getElementById('reportReasonSelect').value;
    const details = document.getElementById('reportDetailsInput').value.trim();

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending...';

    let result = null;
    try {
      result = await coreApiRequest('/reports', {
        method: 'POST',
        body: JSON.stringify({
          reporter_id: userId,
          target_type: targetType,
          target_id: targetId,
          reason: reason,
          details: details
        })
      });
    } catch (err) {
      result = null;
    }

    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Submit';
    closeReportModal();

    if (result && result.success) {
      const label = itemLabel.charAt(0).toUpperCase() + itemLabel.slice(1);
      coreShowAlert(`🚩 ${label} reported. Thank you!`, 'success');
      if (typeof opts.onSuccess === 'function') opts.onSuccess();
    } else if (result) {
      coreShowAlert(result.error || 'Could not submit report.', 'error');
    } else {
      // coreApiRequest already surfaces network/server errors via its own
      // showAlert call, but guard here in case that path returned nothing.
      coreShowAlert('Could not submit report. Please try again.', 'error');
    }
  });

  document.getElementById('customReportModal').classList.add('show');
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
window.openShareSheet = openShareSheet;
window.openReportModal = openReportModal;


// Auto test connection on load
setTimeout(async () => {
  await testAPIConnection();
}, 2000);

// Check auth status
checkAuth();