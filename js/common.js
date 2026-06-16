// কমন ফাংশন - সব পেজের জন্য
document.addEventListener('DOMContentLoaded', function() {
    // ড্রপডাউন মেনু বন্ধ করার জন্য
    document.addEventListener('click', function() {
        const dropdown = document.getElementById('userDropdown');
        if (dropdown) {
            dropdown.classList.remove('show');
        }
    });
    
    // নেভিগেশন একটিভ লিংক
    const currentPage = window.location.pathname.split('/').pop();
    document.querySelectorAll('.nav-icon').forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage) {
            link.classList.add('active');
        }
    });
});