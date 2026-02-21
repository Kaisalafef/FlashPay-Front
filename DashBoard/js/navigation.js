/**
 * Navigation System
 * =================
 * Handles section switching with smooth transitions and data fetching
 */

// Data cache to minimize API calls
const dataCache = {
    reports: null,
    transfers: null,
    employees: null,
    offices: null,
    lastFetch: {
        reports: 0,
        transfers: 0,
        employees: 0,
        offices: 0
    }
};

// Cache expiration time (5 minutes)
const CACHE_EXPIRY = 5 * 60 * 1000;

/**
 * Initialize navigation system
 */
function initNavigation() {
    // Add click handlers to all nav items
    const navItems = document.querySelectorAll('.sidebar nav ul li');
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionId = this.dataset.section;
            if (sectionId) {
                showSection(sectionId);
                
                // Update active state in sidebar
                navItems.forEach(nav => nav.classList.remove('active'));
                this.classList.add('active');
                
                // Update page title
                updatePageTitle(this.textContent.trim());
            }
        });
    });
}

/**
 * Show a specific section with smooth transition
 * @param {string} sectionId - ID of the section to show
 */
function showSection(sectionId) {
    // Get all role sections
    const allSections = document.querySelectorAll('.role-section, #section-stats');
    
    // Hide all sections with fade out
    allSections.forEach(section => {
        if (!section.classList.contains('hidden')) {
            section.style.opacity = '0';
            section.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                section.classList.add('hidden');
                section.style.display = 'none';
            }, 300);
        }
    });
    
    // Show target section with fade in
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        setTimeout(() => {
            targetSection.classList.remove('hidden');
            targetSection.style.display = 'block';
            
            // Trigger reflow for animation
            targetSection.offsetHeight;
            
            targetSection.style.opacity = '1';
            targetSection.style.transform = 'translateY(0)';
            
            // Fetch fresh data for the section
            fetchSectionData(sectionId);
        }, 350);
    }
}

/**
 * Update page title based on active section
 * @param {string} title - New page title
 */
function updatePageTitle(title) {
    const pageTitle = document.getElementById('page-title');
    if (pageTitle) {
        // Extract text without icon
        const cleanTitle = title.replace(/<i[^>]*>.*?<\/i>/g, '').trim();
        pageTitle.textContent = cleanTitle;
    }
}

/**
 * Fetch data for a specific section
 * @param {string} sectionId - Section ID
 */
async function fetchSectionData(sectionId) {
    const now = Date.now();
    
    switch(sectionId) {
        case 'role-reports':
            // Fetch reports data if cache is expired
            if (!dataCache.reports || (now - dataCache.lastFetch.reports) > CACHE_EXPIRY) {
                await fetchReportsData();
                dataCache.lastFetch.reports = now;
            }
            break;
            
        case 'role-transfers':
            // Fetch transfers data if cache is expired
            if (!dataCache.transfers || (now - dataCache.lastFetch.transfers) > CACHE_EXPIRY) {
                await searchTransfers();
                dataCache.lastFetch.transfers = now;
            }
            break;
            
        case 'role-employees':
            // Refresh employees table
            if (typeof refreshEmployeesTable === 'function') {
                refreshEmployeesTable();
            }
            break;
            
        case 'role-super-admin':
            // Refresh offices table
            if (typeof refreshOfficesTable === 'function') {
                refreshOfficesTable();
            }
            break;
    }
}

/**
 * Clear data cache for a specific section or all sections
 * @param {string} section - Section name (optional, clears all if not provided)
 */
function clearDataCache(section = null) {
    if (section) {
        dataCache[section] = null;
        dataCache.lastFetch[section] = 0;
    } else {
        // Clear all caches
        Object.keys(dataCache).forEach(key => {
            if (key !== 'lastFetch') {
                dataCache[key] = null;
            }
        });
        Object.keys(dataCache.lastFetch).forEach(key => {
            dataCache.lastFetch[key] = 0;
        });
    }
}

/**
 * Refresh all data (call this after major changes)
 */
async function refreshAllData() {
    clearDataCache();
    
    // Get currently visible section
    const visibleSection = document.querySelector('.role-section:not(.hidden), #section-stats:not(.hidden)');
    if (visibleSection) {
        await fetchSectionData(visibleSection.id);
    }
    
    showNotification('تم تحديث البيانات بنجاح', 'success');
}

// Export functions for global access
if (typeof window !== 'undefined') {
    window.initNavigation = initNavigation;
    window.showSection = showSection;
    window.fetchSectionData = fetchSectionData;
    window.clearDataCache = clearDataCache;
    window.refreshAllData = refreshAllData;
}
