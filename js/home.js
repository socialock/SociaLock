let currentUser = null;
let allPosts = [];
let currentDisplayPosts = [];
let currentPage = 0;
const POSTS_PER_PAGE = 40;
const ADS_INTERVAL = 4;

// ============================================
// টাইম ফরমেট ফাংশন - ডিবাগ ভার্সন
// ============================================
function timeAgo(date) {
    if (!date) return 'এখনই';
    
    try {
        // ডাটাবেজ থেকে আসা সময়
        const dbTime = new Date(date);
        
        // চেক করুন ডাটাবেজের সময় UTC তে আছে কিনা
        // যদি 6 ঘন্টা কম দেখায়, তাহলে +6 ঘন্টা যোগ করুন
        const now = new Date();
        const diffCheck = (now - dbTime) / (1000 * 60 * 60);
        
        let adjustedTime = dbTime;
        
        // যদি ডিফারেন্স 6 ঘন্টার বেশি হয় এবং সময়টা 6 ঘন্টা আগে দেখায়
        // তাহলে আমরা ধরে নিচ্ছি ডাটাবেজ UTC তে আছে
        if (diffCheck > 5 && diffCheck < 7) {
            // UTC থেকে GMT+6 এ কনভার্ট
            adjustedTime = new Date(dbTime.getTime() + (6 * 60 * 60 * 1000));
            console.log('Adjusted time from UTC to GMT+6');
        }
        
        const diffInSeconds = Math.floor((now - adjustedTime) / 1000);
        
        console.log('Time debug:', {
            original: date,
            dbTime: dbTime.toLocaleString(),
            adjusted: adjustedTime.toLocaleString(),
            now: now.toLocaleString(),
            diffSeconds: diffInSeconds
        });
        
        if (diffInSeconds < 5) return 'এখনই';
        if (diffInSeconds < 60) return `${diffInSeconds} সেকেন্ড আগে`;
        
        const minutes = Math.floor(diffInSeconds / 60);
        if (minutes < 60) return `${minutes} মিনিট আগে`;
        
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours} ঘন্টা আগে`;
        
        const days = Math.floor(hours / 24);
        if (days < 7) return `${days} দিন আগে`;
        
        const weeks = Math.floor(days / 7);
        if (weeks < 4) return `${weeks} সপ্তাহ আগে`;
        
        const months = Math.floor(days / 30);
        if (months < 12) return `${months} মাস আগে`;
        
        const years = Math.floor(days / 365);
        return `${years} বছর আগে`;
        
    } catch (error) {
        console.error('timeAgo error:', error);
        return 'এখনই';
    }
}

// ============================================
// পেজ লোড
// ============================================
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Page loaded - Timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone);
    console.log('Current time:', new Date().toLocaleString());
    
    const userId = localStorage.getItem('userId');
    if (!userId) {
        window.location.href = 'login.html';
        return;
    }
    
    const supabase = window.getSupabase();
    if (!supabase) {
        showAlert('Supabase সংযোগ নেই!', 'error');
        return;
    }
    
    // ইউজার তথ্য লোড
    const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
    
    if (userError || !user) {
        showAlert('ইউজার তথ্য লোড করতে সমস্যা!', 'error');
        localStorage.removeItem('userId');
        window.location.href = 'login.html';
        return;
    }
    
    currentUser = user;
    console.log('User loaded:', currentUser.username);
    
    // পোস্ট লোড
    await loadPosts();
    
    // পোস্ট ক্রিয়েট
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
    
    // ড্রপডাউন মেনু
    const userMenuBtn = document.getElementById('userMenuBtn');
    const userDropdown = document.getElementById('userDropdown');
    
    if (userMenuBtn) {
        userMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            userDropdown.classList.toggle('show');
        });
        document.addEventListener('click', () => userDropdown.classList.remove('show'));
    }
    
    // মেনু আইটেম
    document.getElementById('myPostsBtn')?.addEventListener('click', showMyPosts);
    document.getElementById('changePasswordBtn')?.addEventListener('click', changePassword);
    document.getElementById('deleteAccountBtn')?.addEventListener('click', deleteAccount);
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        localStorage.removeItem('userId');
        window.location.href = 'index.html';
    });
    
    // স্ক্রল ইভেন্ট
    let loading = false;
    window.addEventListener('scroll', async function() {
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
            if (!loading && currentDisplayPosts.length > 0 && currentDisplayPosts.length < allPosts.length) {
                loading = true;
                await loadMorePosts();
                loading = false;
            }
        }
    });
    
    // প্রতি 30 সেকেন্ডে টাইম আপডেট
    setInterval(() => {
        if (currentDisplayPosts.length > 0) {
            updateAllTimes();
        }
    }, 30000);
});

function updateAllTimes() {
    document.querySelectorAll('.post-time').forEach(el => {
        const timestamp = el.getAttribute('data-timestamp');
        if (timestamp) {
            const newTime = timeAgo(timestamp);
            el.innerHTML = `⏱️ ${newTime}`;
        }
    });
    document.querySelectorAll('.comment-time').forEach(el => {
        const timestamp = el.getAttribute('data-timestamp');
        if (timestamp) {
            const newTime = timeAgo(timestamp);
            el.innerHTML = `⏱️ ${newTime}`;
        }
    });
}

async function loadPosts() {
    const supabase = window.getSupabase();
    if (!supabase) return;
    
    console.log('Loading posts from Supabase...');
    
    const { data: posts, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
    
    if (error) {
        console.error('Load error:', error);
        return;
    }
    
    console.log('Posts loaded:', posts?.length);
    if (posts && posts.length > 0) {
        console.log('Sample post time:', posts[0].created_at);
        console.log('Parsed as local:', new Date(posts[0].created_at).toLocaleString());
    }
    
    allPosts = posts || [];
    allPosts = shuffleArray(allPosts);
    currentDisplayPosts = allPosts.slice(0, POSTS_PER_PAGE);
    currentPage = 1;
    
    displayPostsWithAds(currentDisplayPosts);
}

async function loadMorePosts() {
    const start = currentPage * POSTS_PER_PAGE;
    const end = start + POSTS_PER_PAGE;
    const newPosts = allPosts.slice(start, end);
    
    if (newPosts.length > 0) {
        currentDisplayPosts = [...currentDisplayPosts, ...newPosts];
        currentPage++;
        displayPostsWithAds(currentDisplayPosts);
    }
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

async function createPost() {
    let content = document.getElementById('postContent').value;
    
    if (!content.trim()) {
        showAlert('পোস্ট খালি হতে পারে না!', 'error');
        return;
    }
    
    if (content.length > 300) {
        showAlert('৩০০ অক্ষরের বেশি হতে পারে না!', 'error');
        return;
    }
    
    content = content.replace(/\n/g, '<br>');
    
    const supabase = window.getSupabase();
    const btn = document.getElementById('createPostBtn');
    
    btn.disabled = true;
    btn.textContent = '⏳ পোস্ট হচ্ছে...';
    
    // বর্তমান সময় UTC তে সেভ করা
    const now = new Date();
    console.log('Creating post at:', now.toLocaleString());
    
    const { error } = await supabase.from('posts').insert({
        user_id: currentUser.id,
        username: currentUser.username,
        content: content,
        likes_count: 0,
        comments_count: 0,
        created_at: now.toISOString()
    });
    
    if (error) {
        showAlert('পোস্ট করতে সমস্যা!', 'error');
    } else {
        showAlert('✅ পোস্ট হয়েছে!', 'success');
        document.getElementById('postContent').value = '';
        document.getElementById('charCount').textContent = '0/300';
        await loadPosts();
    }
    
    btn.disabled = false;
    btn.textContent = '📤 পোস্ট করুন';
}

async function displayPostsWithAds(posts) {
    const container = document.getElementById('postsContainer');
    if (!container) return;
    
    if (posts.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:2rem;">📝 কোন পোস্ট নেই। প্রথম পোস্টটি করুন!</div>';
        return;
    }
    
    container.innerHTML = '';
    
    for (let i = 0; i < posts.length; i++) {
        const post = posts[i];
        const postElement = await createPostElement(post);
        container.appendChild(postElement);
        
        if ((i + 1) % ADS_INTERVAL === 0 && i !== posts.length - 1) {
            const adElement = await getRandomAd();
            if (adElement) {
                container.appendChild(adElement);
            }
        }
    }
}

async function createPostElement(post) {
    const supabase = window.getSupabase();
    
    let userLiked = false;
    if (currentUser) {
        const { data: likeData } = await supabase
            .from('likes')
            .select('id')
            .eq('post_id', post.id)
            .eq('user_id', currentUser.id)
            .maybeSingle();
        userLiked = !!likeData;
    }
    
    const timeText = timeAgo(post.created_at);
    
    let content = post.content;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    content = content.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
    
    const postDiv = document.createElement('div');
    postDiv.className = 'post-card';
    postDiv.id = `post-${post.id}`;
    postDiv.innerHTML = `
        <div class="post-header">
            <span class="post-author">👤 ${escapeHtml(post.username)}</span>
            <span class="post-time" data-timestamp="${post.created_at}">⏱️ ${timeText}</span>
        </div>
        <div class="post-content">${content}</div>
        <div class="post-stats">
            <button class="like-btn ${userLiked ? 'liked' : ''}" data-id="${post.id}">
                ❤️ <span class="like-count">${post.likes_count || 0}</span>
            </button>
            <button class="comment-btn" data-id="${post.id}">
                💬 <span class="comment-count">${post.comments_count || 0}</span>
            </button>
            ${post.user_id === currentUser?.id ? `<button class="delete-post" data-id="${post.id}">🗑️ ডিলিট</button>` : ''}
        </div>
        <div class="comments-section" id="comments-${post.id}" style="display: none;">
            <div class="comments-list" id="comments-list-${post.id}"></div>
            <div class="comment-form">
                <input type="text" id="comment-input-${post.id}" placeholder="কমেন্ট লিখুন..." maxlength="200">
                <button onclick="addComment(${post.id})">পোস্ট করুন</button>
            </div>
        </div>
    `;
    
    const likeBtn = postDiv.querySelector('.like-btn');
    if (likeBtn) {
        likeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleLike(post.id, likeBtn);
        });
    }
    
    const commentBtn = postDiv.querySelector('.comment-btn');
    if (commentBtn) {
        commentBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleComments(post.id);
        });
    }
    
    const deleteBtn = postDiv.querySelector('.delete-post');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => deletePost(post.id));
    }
    
    return postDiv;
}

window.toggleComments = async function(postId) {
    const commentsSection = document.getElementById(`comments-${postId}`);
    if (!commentsSection) return;
    
    if (commentsSection.style.display === 'none') {
        commentsSection.style.display = 'block';
        await loadComments(postId);
    } else {
        commentsSection.style.display = 'none';
    }
}

async function loadComments(postId) {
    const supabase = window.getSupabase();
    const container = document.getElementById(`comments-list-${postId}`);
    if (!container) return;
    
    const { data: comments, error } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });
    
    if (error) {
        console.error('Load comments error:', error);
        return;
    }
    
    if (comments.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:0.5rem;color:var(--text-secondary);">💬 কোন কমেন্ট নেই। প্রথম কমেন্টটি করুন!</div>';
        return;
    }
    
    container.innerHTML = '';
    comments.forEach(comment => {
        const timeText = timeAgo(comment.created_at);
        const isOwner = currentUser && comment.user_id === currentUser.id;
        
        const commentDiv = document.createElement('div');
        commentDiv.className = 'comment-item';
        commentDiv.innerHTML = `
            <div class="comment-header">
                <div class="comment-author-info">
                    <span class="comment-author">👤 ${escapeHtml(comment.username)}</span>
                    <span class="comment-time" data-timestamp="${comment.created_at}">⏱️ ${timeText}</span>
                </div>
                ${isOwner ? `<button class="delete-comment-btn" onclick="deleteComment(${comment.id}, ${postId})">🗑️ ডিলিট</button>` : ''}
            </div>
            <div class="comment-content">${escapeHtml(comment.content)}</div>
        `;
        container.appendChild(commentDiv);
    });
}

window.addComment = async function(postId) {
    const input = document.getElementById(`comment-input-${postId}`);
    const content = input.value.trim();
    
    if (!content) {
        showAlert('কমেন্ট খালি হতে পারে না!', 'error');
        return;
    }
    
    if (content.length > 200) {
        showAlert('কমেন্ট ২০০ অক্ষরের বেশি হতে পারে না!', 'error');
        return;
    }
    
    const supabase = window.getSupabase();
    
    const { data, error } = await supabase
        .from('comments')
        .insert({
            post_id: postId,
            user_id: currentUser.id,
            username: currentUser.username,
            content: content,
            created_at: new Date().toISOString()
        })
        .select();
    
    if (error) {
        showAlert('কমেন্ট করতে সমস্যা!', 'error');
        return;
    }
    
    const post = allPosts.find(p => p.id === postId);
    if (post) {
        const newCount = (post.comments_count || 0) + 1;
        await supabase.from('posts').update({ comments_count: newCount }).eq('id', postId);
        post.comments_count = newCount;
        
        const commentCountSpan = document.querySelector(`.comment-btn[data-id="${postId}"] .comment-count`);
        if (commentCountSpan) {
            commentCountSpan.textContent = newCount;
        }
    }
    
    input.value = '';
    await loadComments(postId);
    showAlert('✅ কমেন্ট করা হয়েছে!', 'success');
}

window.deleteComment = async function(commentId, postId) {
    if (!confirm('আপনি কি এই কমেন্ট ডিলিট করতে চান?')) return;
    
    const supabase = window.getSupabase();
    
    try {
        const { data: comment, error: fetchError } = await supabase
            .from('comments')
            .select('user_id')
            .eq('id', commentId)
            .single();
        
        if (fetchError || !comment) {
            showAlert('কমেন্ট পাওয়া যায়নি!', 'error');
            return;
        }
        
        if (comment.user_id !== currentUser.id) {
            showAlert('❌ আপনি শুধু নিজের কমেন্ট ডিলিট করতে পারবেন!', 'error');
            return;
        }
        
        const { error } = await supabase
            .from('comments')
            .delete()
            .eq('id', commentId);
        
        if (error) {
            showAlert('কমেন্ট ডিলিট করতে সমস্যা!', 'error');
            return;
        }
        
        const post = allPosts.find(p => p.id === postId);
        if (post) {
            const newCount = Math.max(0, (post.comments_count || 0) - 1);
            await supabase.from('posts').update({ comments_count: newCount }).eq('id', postId);
            post.comments_count = newCount;
            
            const commentCountSpan = document.querySelector(`.comment-btn[data-id="${postId}"] .comment-count`);
            if (commentCountSpan) {
                commentCountSpan.textContent = newCount;
            }
        }
        
        await loadComments(postId);
        showAlert('✅ কমেন্ট ডিলিট হয়েছে!', 'success');
        
    } catch (error) {
        console.error('Delete comment error:', error);
        showAlert('কমেন্ট ডিলিট করতে সমস্যা!', 'error');
    }
}

async function toggleLike(postId, buttonElement) {
    const supabase = window.getSupabase();
    const isLiked = buttonElement.classList.contains('liked');
    const likeCountSpan = buttonElement.querySelector('.like-count');
    let currentCount = parseInt(likeCountSpan.textContent) || 0;
    
    if (isLiked) {
        const { error } = await supabase
            .from('likes')
            .delete()
            .eq('post_id', postId)
            .eq('user_id', currentUser.id);
        
        if (!error) {
            buttonElement.classList.remove('liked');
            const newCount = currentCount - 1;
            likeCountSpan.textContent = newCount;
            await supabase.from('posts').update({ likes_count: newCount }).eq('id', postId);
            
            const post = allPosts.find(p => p.id === postId);
            if (post) post.likes_count = newCount;
        }
    } else {
        const { error } = await supabase
            .from('likes')
            .insert({
                post_id: postId,
                user_id: currentUser.id,
                created_at: new Date().toISOString()
            });
        
        if (!error) {
            buttonElement.classList.add('liked');
            const newCount = currentCount + 1;
            likeCountSpan.textContent = newCount;
            await supabase.from('posts').update({ likes_count: newCount }).eq('id', postId);
            
            const post = allPosts.find(p => p.id === postId);
            if (post) post.likes_count = newCount;
        }
    }
}

async function getRandomAd() {
    const supabase = window.getSupabase();
    const userCountry = currentUser?.country || 'বাংলাদেশ';
    
    const { data: ads } = await supabase
        .from('ads')
        .select('*')
        .eq('target_country', userCountry);
    
    if (!ads || ads.length === 0) return null;
    
    const randomAd = ads[Math.floor(Math.random() * ads.length)];
    
    const adDiv = document.createElement('div');
    adDiv.className = 'ad-card';
    adDiv.innerHTML = `
        <a href="${randomAd.link}" target="_blank" rel="noopener noreferrer">
            <img src="${randomAd.image_url}" alt="${randomAd.caption}" loading="lazy">
            <p class="ad-caption">📢 ${escapeHtml(randomAd.caption)}</p>
        </a>
    `;
    
    return adDiv;
}

async function deletePost(postId) {
    if (!confirm('পোস্ট ডিলিট করবেন? সব কমেন্ট ও লাইকও মুছে যাবে!')) return;
    
    const supabase = window.getSupabase();
    
    await supabase.from('comments').delete().eq('post_id', postId);
    await supabase.from('likes').delete().eq('post_id', postId);
    const { error } = await supabase.from('posts').delete().eq('id', postId).eq('user_id', currentUser.id);
    
    if (error) {
        showAlert('ডিলিট করতে সমস্যা!', 'error');
    } else {
        showAlert('✅ পোস্ট ডিলিট হয়েছে!', 'success');
        await loadPosts();
    }
}

function showMyPosts() {
    const myPosts = allPosts.filter(p => p.user_id === currentUser.id);
    displayPostsWithAds(myPosts);
    document.getElementById('userDropdown')?.classList.remove('show');
}

async function changePassword() {
    const newPass = prompt('নতুন পাসওয়ার্ড দিন (৬+ অক্ষর):');
    if (!newPass) return;
    if (newPass.length < 6) {
        showAlert('পাসওয়ার্ড ৬+ অক্ষর হতে হবে!', 'error');
        return;
    }
    
    const supabase = window.getSupabase();
    const { error } = await supabase.auth.updateUser({ password: newPass });
    
    if (error) {
        showAlert('পাসওয়ার্ড পরিবর্তন ব্যর্থ!', 'error');
    } else {
        showAlert('✅ পাসওয়ার্ড পরিবর্তন হয়েছে!', 'success');
    }
}

async function deleteAccount() {
    if (!confirm('⚠️ একাউন্ট ডিলিট করলে সব পোস্ট, কমেন্ট ও লাইক মুছে যাবে! নিশ্চিত?')) return;
    
    const supabase = window.getSupabase();
    
    const { data: userPosts } = await supabase.from('posts').select('id').eq('user_id', currentUser.id);
    
    if (userPosts) {
        for (const post of userPosts) {
            await supabase.from('comments').delete().eq('post_id', post.id);
            await supabase.from('likes').delete().eq('post_id', post.id);
        }
    }
    
    await supabase.from('posts').delete().eq('user_id', currentUser.id);
    await supabase.from('comments').delete().eq('user_id', currentUser.id);
    await supabase.from('likes').delete().eq('user_id', currentUser.id);
    await supabase.from('users').delete().eq('id', currentUser.id);
    await supabase.auth.signOut();
    
    localStorage.removeItem('userId');
    showAlert('✅ একাউন্ট ডিলিট হয়েছে!', 'success');
    setTimeout(() => window.location.href = 'index.html', 1500);
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}