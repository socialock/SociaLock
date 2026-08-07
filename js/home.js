// Placeholder for home.js
// ============================================================
// 📁 js/home.js - Home Page (API Version)
// ============================================================

let currentUser = null;
let allPosts = [];
let currentDisplayPosts = [];
let currentPage = 0;
const POSTS_PER_PAGE = 40;
const ADS_INTERVAL = 4;

// ============================================
// TIME FORMAT
// ============================================
function timeAgo(date) {
    if (!date) return 'Just now';
    try {
        const now = new Date();
        const past = new Date(date);
        const diffInSeconds = Math.floor((now - past) / 1000);
        
        if (diffInSeconds < 5) return 'Just now';
        if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
        const minutes = Math.floor(diffInSeconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        if (days < 7) return `${days}d ago`;
        const weeks = Math.floor(days / 7);
        if (weeks < 4) return `${weeks}w ago`;
        const months = Math.floor(days / 30);
        if (months < 12) return `${months}mo ago`;
        const years = Math.floor(days / 365);
        return `${years}y ago`;
    } catch (e) {
        return 'Just now';
    }
}

function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// LOAD POSTS FROM API
// ============================================
async function loadPosts() {
    const container = document.getElementById('postsContainer');
    container.innerHTML = '<div class="loading-spinner">⏳ Loading posts...</div>';
    
    try {
        const result = await window.apiRequest('/posts');
        
        if (!result || !result.success) {
            container.innerHTML = '<div class="no-posts">❌ Failed to load posts</div>';
            return;
        }
        
        const posts = result.data || [];
        
        if (posts.length === 0) {
            container.innerHTML = '<div class="no-posts">📝 No posts yet. Create one!</div>';
            return;
        }
        
        allPosts = posts;
        allPosts = shuffleArray(allPosts);
        currentDisplayPosts = allPosts.slice(0, POSTS_PER_PAGE);
        currentPage = 1;
        
        displayPostsWithAds(currentDisplayPosts);
        
    } catch (error) {
        console.error('Load posts error:', error);
        container.innerHTML = '<div class="no-posts">❌ Failed to load posts</div>';
    }
}

// ============================================
// CREATE POST
// ============================================
async function createPost() {
    let content = document.getElementById('postContent').value;
    
    if (!content.trim()) {
        showAlert('Post cannot be empty!', 'error');
        return;
    }
    
    if (content.length > 300) {
        showAlert('Maximum 300 characters!', 'error');
        return;
    }
    
    const btn = document.getElementById('createPostBtn');
    btn.disabled = true;
    btn.textContent = '⏳ Posting...';
    
    try {
        const result = await window.apiRequest('/posts', {
            method: 'POST',
            body: JSON.stringify({
                user_id: currentUser.id,
                username: currentUser.username,
                content: content
            })
        });
        
        if (result && result.success) {
            showAlert('✅ Post created!', 'success');
            document.getElementById('postContent').value = '';
            document.getElementById('charCount').textContent = '0/300';
            await loadPosts();
        }
    } catch (error) {
        showAlert('Failed to create post!', 'error');
    }
    
    btn.disabled = false;
    btn.textContent = '📤 Post';
}

// ============================================
// TOGGLE LIKE
// ============================================
window.toggleLike = async function(postId) {
    if (!currentUser) {
        showAlert('Please login first!', 'error');
        return;
    }
    
    const btn = document.querySelector(`.post-action-btn[onclick*="toggleLike('${postId}')"]`);
    if (!btn) return;
    
    const isLiked = btn.classList.contains('liked');
    const likeCountSpan = document.getElementById(`likeCount-${postId}`);
    if (!likeCountSpan) return;
    
    let currentCount = parseInt(likeCountSpan.textContent) || 0;
    
    try {
        if (isLiked) {
            const result = await window.apiRequest(`/posts/${postId}/like`, {
                method: 'DELETE',
                body: JSON.stringify({ user_id: currentUser.id })
            });
            
            if (result && result.success) {
                btn.classList.remove('liked');
                likeCountSpan.textContent = currentCount - 1;
            }
        } else {
            const result = await window.apiRequest(`/posts/${postId}/like`, {
                method: 'POST',
                body: JSON.stringify({ user_id: currentUser.id })
            });
            
            if (result && result.success) {
                btn.classList.add('liked');
                likeCountSpan.textContent = currentCount + 1;
            }
        }
    } catch (error) {
        console.error('Toggle like error:', error);
    }
};

// ============================================
// DELETE POST
// ============================================
window.deletePost = async function(postId) {
    if (!confirm('Are you sure you want to delete this post?')) return;
    
    try {
        const result = await window.apiRequest(`/posts/${postId}`, {
            method: 'DELETE',
            body: JSON.stringify({ user_id: currentUser.id })
        });
        
        if (result && result.success) {
            showAlert('✅ Post deleted!', 'success');
            await loadPosts();
        }
    } catch (error) {
        showAlert('Failed to delete post!', 'error');
    }
};

// ============================================
// DISPLAY POSTS
// ============================================
async function displayPostsWithAds(posts) {
    const container = document.getElementById('postsContainer');
    if (!container) return;
    
    if (posts.length === 0) {
        container.innerHTML = '<div class="no-posts">📝 No posts to show.</div>';
        return;
    }
    
    container.innerHTML = '';
    
    for (let i = 0; i < posts.length; i++) {
        const post = posts[i];
        const postElement = await createPostElement(post);
        container.appendChild(postElement);
        
        // Add ad after every 4 posts
        if ((i + 1) % ADS_INTERVAL === 0 && i !== posts.length - 1) {
            const adElement = await getRandomAd();
            if (adElement) {
                container.appendChild(adElement);
            }
        }
    }
}

// ============================================
// CREATE POST ELEMENT
// ============================================
async function createPostElement(post) {
    const userId = localStorage.getItem('userId');
    const isOwner = userId && post.user_id === userId;
    
    // Check if user liked
    let userLiked = false;
    try {
        const result = await window.apiRequest(`/posts/${post.id}/liked?userId=${userId}`);
        if (result && result.success) {
            userLiked = result.data;
        }
    } catch (e) {}
    
    const timeAgoText = timeAgo(post.created_at);
    let content = post.content || '';
    content = content.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>');
    
    const postDiv = document.createElement('div');
    postDiv.className = 'post-card';
    postDiv.id = `post-${post.id}`;
    
    postDiv.innerHTML = `
        <div class="post-header">
            <div class="post-user">
                <div class="post-avatar" onclick="window.location.href='userprofile.html?userId=${post.user_id}'">
                    ${(post.username || 'U').charAt(0).toUpperCase()}
                </div>
                <div class="post-user-info">
                    <div class="post-username">
                        <span onclick="window.location.href='userprofile.html?userId=${post.user_id}'">
                            ${escapeHtml(post.username || 'User')}
                        </span>
                        ${post.is_verified ? '<span class="verified-badge">✓</span>' : ''}
                    </div>
                    <div class="post-time">${timeAgoText}</div>
                </div>
            </div>
            ${isOwner ? `
            <div style="position:relative;">
                <button class="post-more-btn" onclick="togglePostMenu('post-${post.id}')">•••</button>
                <div class="post-more-menu" id="menu-post-${post.id}">
                    <a onclick="copyPostLink('${post.id}')">🔗 Copy Link</a>
                    <a class="danger" onclick="deletePost('${post.id}')">🗑️ Delete</a>
                </div>
            </div>
            ` : ''}
        </div>
        <div class="post-content">${content}</div>
        <div class="post-stats">
            <span>❤️ <span id="likeCount-${post.id}">${post.likes_count || 0}</span></span>
            <span onclick="window.location.href='post.html?postId=${post.id}'">💬 ${post.comments_count || 0} comments</span>
        </div>
        <div class="post-actions">
            <button class="post-action-btn ${userLiked ? 'liked' : ''}" onclick="toggleLike('${post.id}')">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                <span>Like</span>
            </button>
            <button class="post-action-btn" onclick="window.location.href='post.html?postId=${post.id}'">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 6h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1zm-4 6V3c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v14l4-4h10c.55 0 1-.45 1-1z"/></svg>
                <span>Comment</span>
            </button>
        </div>
    `;
    
    return postDiv;
}

// ============================================
// GET RANDOM AD
// ============================================
async function getRandomAd() {
    try {
        const country = currentUser?.country || 'Bangladesh';
        const result = await window.apiRequest(`/ads?country=${country}`);
        
        if (result && result.success && result.data.length > 0) {
            const ads = result.data;
            const ad = ads[Math.floor(Math.random() * ads.length)];
            
            const adDiv = document.createElement('div');
            adDiv.className = 'ad-card';
            adDiv.innerHTML = `
                <div class="ad-sponsored">📢 Sponsored</div>
                <a href="${ad.link}" target="_blank">
                    <img src="${ad.image_url}" alt="${ad.caption}">
                    <div class="ad-caption">${escapeHtml(ad.caption)}</div>
                </a>
            `;
            return adDiv;
        }
    } catch (e) {
        console.error('Ad load error:', e);
    }
    return null;
}

// ============================================
// SEARCH USERS
// ============================================
async function searchUsers(query) {
    if (!query || query.length < 2) return [];
    
    try {
        const result = await window.apiRequest(`/users/search?q=${encodeURIComponent(query)}`);
        if (result && result.success) {
            return result.data;
        }
    } catch (e) {
        console.error('Search error:', e);
    }
    return [];
}

// ============================================
// COPY POST LINK
// ============================================
function copyPostLink(postId) {
    const url = window.location.origin + '/post.html?postId=' + postId;
    if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(() => {
            showAlert('✅ Link copied!', 'success');
        });
    } else {
        prompt('Copy this link:', url);
    }
}

// ============================================
// PAGE LOAD
// ============================================
document.addEventListener('DOMContentLoaded', async function() {
    const userId = localStorage.getItem('userId');
    if (!userId) {
        window.location.href = 'login.html';
        return;
    }
    
    // Get current user
    try {
        const result = await window.apiRequest(`/users/${userId}`);
        if (result && result.success) {
            currentUser = result.data;
            
            // Update UI
            const avatar = document.getElementById('createPostAvatar');
            if (avatar) avatar.textContent = currentUser.username.charAt(0).toUpperCase();
            
            document.getElementById('sideMenuAvatar').textContent = currentUser.username.charAt(0).toUpperCase();
            document.getElementById('sideMenuName').textContent = currentUser.username;
            document.getElementById('sideMenuEmail').textContent = currentUser.email || '';
        } else {
            localStorage.removeItem('userId');
            window.location.href = 'login.html';
            return;
        }
    } catch (error) {
        console.error('User load error:', error);
        localStorage.removeItem('userId');
        window.location.href = 'login.html';
        return;
    }
    
    // Load posts
    await loadPosts();
    
    // Create post button
    const createBtn = document.getElementById('createPostBtn');
    const postContent = document.getElementById('postContent');
    const charCount = document.getElementById('charCount');
    
    if (postContent) {
        postContent.addEventListener('input', () => {
            charCount.textContent = `${postContent.value.length}/300`;
        });
    }
    
    if (createBtn) {
        createBtn.addEventListener('click', createPost);
    }
    
    // Side menu
    document.getElementById('menuToggleBtn')?.addEventListener('click', () => {
        document.getElementById('sidemenu').classList.add('open');
        document.getElementById('sidemenuOverlay').classList.add('show');
    });
    
    document.getElementById('sidemenuOverlay')?.addEventListener('click', () => {
        document.getElementById('sidemenu').classList.remove('open');
        document.getElementById('sidemenuOverlay').classList.remove('show');
    });
    
    document.getElementById('sidemenuProfileBtn')?.addEventListener('click', () => {
        window.location.href = `userprofile.html?userId=${userId}`;
    });
    
    document.getElementById('profileNavBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = `userprofile.html?userId=${userId}`;
    });
    
    document.getElementById('sideMenuLogout')?.addEventListener('click', () => {
        localStorage.removeItem('userId');
        window.location.href = 'login.html';
    });
    
    // Search
    const searchInput = document.getElementById('searchInput');
    const searchFullscreen = document.getElementById('searchFullscreen');
    const searchFullscreenInput = document.getElementById('searchFullscreenInput');
    const searchResults = document.getElementById('searchFullscreenResults');
    const searchCloseBtn = document.getElementById('searchCloseBtn');
    
    if (searchInput) {
        searchInput.addEventListener('click', () => {
            searchFullscreen.classList.add('show');
            setTimeout(() => searchFullscreenInput.focus(), 100);
        });
    }
    
    if (searchCloseBtn) {
        searchCloseBtn.addEventListener('click', () => {
            searchFullscreen.classList.remove('show');
        });
    }
    
    if (searchFullscreenInput) {
        let timeout;
        searchFullscreenInput.addEventListener('input', function() {
            clearTimeout(timeout);
            const query = this.value.trim();
            if (query.length < 2) {
                searchResults.innerHTML = '';
                return;
            }
            timeout = setTimeout(async () => {
                const users = await searchUsers(query);
                if (users.length === 0) {
                    searchResults.innerHTML = '<div class="no-result">🔍 No users found</div>';
                } else {
                    searchResults.innerHTML = users.map(user => `
                        <div class="result-item" onclick="window.location.href='userprofile.html?userId=${user.id}'">
                            <div class="result-avatar">${user.username.charAt(0).toUpperCase()}</div>
                            <div class="result-name">${escapeHtml(user.username)}</div>
                        </div>
                    `).join('');
                }
            }, 300);
        });
    }
    
    console.log('🚀 Home page loaded with Worker API!');
});