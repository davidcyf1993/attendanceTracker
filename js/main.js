// main.js - Main application logic and tab switching

// Tab switching function
function switchToTab(tabName) {
    const tab = new bootstrap.Tab(document.querySelector(`#${tabName}-tab`));
    tab.show();
}

// Common utility functions
function showNotification(message, type) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `alert alert-${type === 'success' ? 'success' : 'danger'} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 1050; min-width: 300px;';
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    document.body.appendChild(notification);

    // Auto remove after 3 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 3000);
}



document.addEventListener('DOMContentLoaded', function () {
    // Try to restore from localStorage if possible
    if (typeof DataHelper !== 'undefined' && DataHelper.init && DataHelper.init()) {
        if (typeof AttendanceTickingManager !== 'undefined' && AttendanceTickingManager.enableAppUIAfterWorkbookLoad) {
            AttendanceTickingManager.enableAppUIAfterWorkbookLoad();
        }
    }

    // Initialize download template functionality
    if (typeof DownloadTemplateManager !== 'undefined') {
        DownloadTemplateManager.init();
    }

    // Initialize attendance ticking functionality
    if (typeof AttendanceTickingManager !== 'undefined') {
        AttendanceTickingManager.init();
    }

    // Add sidebar toggle button for mobile
    function ensureSidebarToggleBtn() {
        if (window.innerWidth <= 575) {
            if (!document.getElementById('sidebarToggleBtn')) {
                const btn = document.createElement('button');
                btn.id = 'sidebarToggleBtn';
                btn.type = 'button';
                btn.setAttribute('aria-label', 'Show menu');
                btn.innerHTML = '<i class="bi bi-list"></i>';
                document.body.appendChild(btn);
            }
        } else {
            // Remove toggle button if not on mobile
            const btn = document.getElementById('sidebarToggleBtn');
            if (btn) btn.remove();
        }
    }
    ensureSidebarToggleBtn();
    window.addEventListener('resize', ensureSidebarToggleBtn);

    // add event listener to the save button
    document.getElementById('saveAttendanceTabBtn').addEventListener('click', function () {
        console.log('save button clicked');
        DataHelper.downloadWorkbook();
    });

    // Sidebar toggle logic (robust)
    document.addEventListener('click', function (e) {
        const sidebar = document.querySelector('.nav-tabs');
        const toggleBtn = document.getElementById('sidebarToggleBtn');
        if (toggleBtn && (e.target === toggleBtn || toggleBtn.contains(e.target))) {
            if (sidebar) {
                sidebar.classList.add('sidebar-visible');
                document.body.classList.add('sidebar-open');
                // Force nav-tabs to be visible (in case display:none is set by Bootstrap)
                sidebar.style.display = 'flex';
            }
            return;
        }
        if (
            sidebar &&
            sidebar.classList.contains('sidebar-visible') &&
            !sidebar.contains(e.target) &&
            (!toggleBtn || (e.target !== toggleBtn && !toggleBtn.contains(e.target)))
        ) {
            sidebar.classList.remove('sidebar-visible');
            document.body.classList.remove('sidebar-open');
            // Optionally, hide again if needed
            // sidebar.style.display = '';
        }
    });
    // Always re-attach hideSidebar to nav-link clicks
    function attachSidebarHideToTabs() {
        // Do nothing: we do NOT want to close sidebar on tab click anymore
    }
    function hideSidebarOnTabClick() {
        // No-op
    }
    attachSidebarHideToTabs();
    // Also re-attach after any tab switch (in case nav-tabs is re-rendered)
    const observer = new MutationObserver(attachSidebarHideToTabs);
    observer.observe(document.body, { childList: true, subtree: true });
});

