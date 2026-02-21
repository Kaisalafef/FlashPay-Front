/**
 * Authentication Service
 * ======================
 * Handles login, logout, and session management with Laravel Sanctum/JWT
 * 
 * Features:
 * - Secure token storage
 * - User profile management
 * - Role-based initialization
 * - Session expiration handling
 */

(function() {
    'use strict';

    // Auth state
    let currentUser = null;
    let isAuthenticated = false;

    /**
     * Initialize authentication service
     */
    function init() {
        // Check for existing session
        checkExistingSession();
        
        console.log('🔐 Auth Service initialized');
    }

    /**
     * Check for existing valid session
     */
    function checkExistingSession() {
        const token = LaravelAPI.getAccessToken();
        
        if (token) {
            // Validate token by fetching user profile
            fetchUserProfile()
                .then(user => {
                    if (user) {
                        currentUser = user;
                        isAuthenticated = true;
                        initializeUserSession(user);
                    } else {
                        // Invalid token
                        logout();
                    }
                })
                .catch(() => {
                    logout();
                });
        }
    }

    /**
     * Login with credentials
     * @param {string} email - User email
     * @param {string} password - User password
     * @param {string} officeId - Optional office selection for Super Admin
     * @returns {Promise<Object>} Login result
     */
    async function login(email, password, officeId = null) {
        try {
            const response = await fetch(`${LaravelAPI.getBaseUrl()}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    email: email,
                    password: password,
                    office_id: officeId
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            // Save tokens
            LaravelAPI.setTokens(
                data.data.access_token,
                data.data.refresh_token,
                Date.now() + (data.data.expires_in * 1000)
            );

            // Store user data
            currentUser = data.data.user;
            isAuthenticated = true;

            // Save to localStorage for persistence
            saveUserToStorage(currentUser);

            // Initialize session
            initializeUserSession(currentUser);

            return {
                success: true,
                user: currentUser,
                message: 'Login successful'
            };

        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                message: error.message || 'Invalid credentials'
            };
        }
    }

    /**
     * Logout user
     */
    async function logout() {
        try {
            // Call logout endpoint if authenticated
            if (LaravelAPI.isAuthenticated()) {
                await fetch(`${LaravelAPI.getBaseUrl()}/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${LaravelAPI.getAccessToken()}`
                    }
                });
            }
        } catch (error) {
            console.warn('Logout API call failed:', error);
        } finally {
            // Clear all data regardless of API response
            clearSession();
            
            // Redirect to login
            window.location.href = '/login.html';
        }
    }

    /**
     * Fetch user profile from API
     */
    async function fetchUserProfile() {
        try {
            const result = await LaravelAPI.get('/auth/me');
            
            if (result.success) {
                currentUser = result.data;
                saveUserToStorage(currentUser);
                return currentUser;
            }
            
            return null;
        } catch (error) {
            console.error('Failed to fetch user profile:', error);
            return null;
        }
    }

    /**
     * Initialize user session after login
     */
    function initializeUserSession(user) {
        // Set user role
        const role = user.role || 'super_admin';
        localStorage.setItem('userRole', role);

        // Initialize office context
        initOfficeContext(user);

        // Update UI for role
        if (typeof updateUIForRole === 'function') {
            updateUIForRole(role);
        }

        // Show welcome notification
        const userName = user.name || 'User';
        showNotification(`مرحباً ${userName}! تم تسجيل الدخول بنجاح`, 'success');
    }

    /**
     * Initialize office context based on user role
     */
    function initOfficeContext(user) {
        const role = user.role || 'super_admin';
        
        if (role === 'super_admin') {
            // Super Admin: Can select any office, default to all
            const savedOfficeId = localStorage.getItem('currentOfficeId');
            const savedOfficeName = localStorage.getItem('currentOfficeName');
            
            if (savedOfficeId && savedOfficeId !== 'all') {
                setOfficeContext(parseInt(savedOfficeId), savedOfficeName || 'مكتب محدد');
            } else {
                setOfficeContext(null, 'جميع المكاتب');
            }
        } else {
            // Other roles: Fixed to their assigned office
            const assignedOffice = user.office_id || user.assigned_office_id;
            const officeName = user.office_name || 'مكتبي';
            
            if (assignedOffice) {
                setOfficeContext(assignedOffice, officeName);
                localStorage.setItem('userAssignedOffice', assignedOffice);
                localStorage.setItem('userOfficeName', officeName);
            }
        }
    }

    /**
     * Set office context
     */
    function setOfficeContext(officeId, officeName) {
        const context = {
            officeId: officeId,
            officeName: officeName,
            isAllOffices: officeId === null
        };

        // Save to localStorage
        localStorage.setItem('currentOfficeId', officeId || 'all');
        localStorage.setItem('currentOfficeName', officeName);
        localStorage.setItem('currentOfficeContext', JSON.stringify(context));

        // Expose globally
        window.currentOfficeContext = context;

        console.log(`🏢 Office context set: ${officeName}`);
    }

    /**
     * Save user to storage
     */
    function saveUserToStorage(user) {
        try {
            localStorage.setItem('user', JSON.stringify(user));
            localStorage.setItem('userRole', user.role);
        } catch (e) {
            console.warn('Failed to save user to storage');
        }
    }

    /**
     * Clear all session data
     */
    function clearSession() {
        currentUser = null;
        isAuthenticated = false;
        
        LaravelAPI.clearTokens();
        
        try {
            localStorage.removeItem('user');
            localStorage.removeItem('userRole');
            localStorage.removeItem('currentOfficeId');
            localStorage.removeItem('currentOfficeName');
            localStorage.removeItem('currentOfficeContext');
            localStorage.removeItem('userAssignedOffice');
            localStorage.removeItem('userOfficeName');
        } catch (e) {
            console.warn('Failed to clear storage');
        }
        
        window.currentOfficeContext = null;
    }

    /**
     * Get current user
     */
    function getCurrentUser() {
        if (currentUser) return currentUser;
        
        // Try loading from storage
        try {
            const saved = localStorage.getItem('user');
            if (saved) {
                currentUser = JSON.parse(saved);
                return currentUser;
            }
        } catch (e) {
            console.warn('Failed to load user from storage');
        }
        
        return null;
    }

    /**
     * Check if user has specific permission
     */
    function hasPermission(permission) {
        const user = getCurrentUser();
        if (!user) return false;
        
        // Super Admin has all permissions
        if (user.role === 'super_admin') return true;
        
        // Check user permissions array
        if (user.permissions && Array.isArray(user.permissions)) {
            return user.permissions.includes(permission);
        }
        
        // Fallback to role-based check
        return checkRolePermission(user.role, permission);
    }

    /**
     * Check permission based on role
     */
    function checkRolePermission(role, permission) {
        const rolePermissions = {
            admin: ['read', 'write', 'office_manage'],
            accountant: ['read', 'accounting_write'],
            cashier: ['read', 'approve_transfers']
        };
        
        const permissions = rolePermissions[role] || [];
        return permissions.includes(permission);
    }

    /**
     * Check if user is Super Admin
     */
    function isSuperAdmin() {
        const user = getCurrentUser();
        return user && user.role === 'super_admin';
    }

    /**
     * Check if user can access specific office
     */
    function canAccessOffice(officeId) {
        const user = getCurrentUser();
        if (!user) return false;
        
        // Super Admin can access all offices
        if (user.role === 'super_admin') return true;
        
        // Others can only access their assigned office
        return user.office_id === officeId || user.assigned_office_id === officeId;
    }

    /**
     * Get data filter params for API calls
     */
    function getDataFilterParams() {
        const user = getCurrentUser();
        const context = window.currentOfficeContext;
        
        if (!user) return {};
        
        // Super Admin viewing all offices
        if (user.role === 'super_admin' && context && context.isAllOffices) {
            return {};
        }
        
        // Specific office filter
        if (context && context.officeId) {
            return { office_id: context.officeId };
        }
        
        // User's assigned office
        if (user.office_id) {
            return { office_id: user.office_id };
        }
        
        return {};
    }

    /**
     * Request password reset
     */
    async function requestPasswordReset(email) {
        try {
            const response = await fetch(`${LaravelAPI.getBaseUrl()}/auth/forgot-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            return {
                success: response.ok,
                message: data.message
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    /**
     * Change password
     */
    async function changePassword(currentPassword, newPassword) {
        try {
            const result = await LaravelAPI.post('/auth/change-password', {
                current_password: currentPassword,
                new_password: newPassword
            });

            return result;
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    // Public API
    const AuthService = {
        login,
        logout,
        fetchUserProfile,
        getCurrentUser,
        isAuthenticated: () => isAuthenticated || LaravelAPI.isAuthenticated(),
        hasPermission,
        isSuperAdmin,
        canAccessOffice,
        getDataFilterParams,
        requestPasswordReset,
        changePassword,
        initOfficeContext,
        setOfficeContext
    };

    // Initialize on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Expose to window
    window.AuthService = AuthService;

})();
