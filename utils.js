// ============================================
// 🛠️ MEGATOOLS UTILITIES
// File 5/5: Helper Functions
// ============================================

const crypto = require('crypto');
const useragent = require('useragent');

// ============================================
// 🔑 TOKEN GENERATORS
// ============================================
const TokenGenerator = {
    // Generate JWT Token
    generateJWT: (user) => {
        return jwt.sign(
            { 
                id: user._id, 
                masterId: user.masterId, 
                role: user.role,
                email: user.email 
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE }
        );
    },

    // Generate Master ID
    generateMasterId: () => {
        return 'MK_' + crypto.randomBytes(4).toString('hex').toUpperCase();
    },

    // Generate Session ID
    generateSessionId: () => {
        return 'SESS_' + crypto.randomBytes(8).toString('hex').toUpperCase();
    },

    // Generate API Key
    generateApiKey: () => {
        return 'mk_' + crypto.randomBytes(24).toString('hex');
    },

    // Generate Referral Code
    generateReferralCode: () => {
        return crypto.randomBytes(3).toString('hex').toUpperCase();
    },

    // Generate Campaign ID
    generateCampaignId: () => {
        return 'CAMP_' + crypto.randomBytes(4).toString('hex').toUpperCase();
    }
};

// ============================================
// 📊 PARSER FUNCTIONS
// ============================================
const Parser = {
    // Parse User Agent
    parseUserAgent: (ua) => {
        const agent = useragent.parse(ua);
        return {
            browser: agent.family,
            browserVersion: agent.toVersion(),
            os: agent.os.family,
            osVersion: agent.os.toVersion(),
            device: agent.device.family,
            isMobile: agent.device.family.toLowerCase().includes('mobile') ||
                     /mobile|android|iphone|ipad/i.test(ua),
            isTablet: /tablet|ipad/i.test(ua),
            isBot: /bot|crawler|spider/i.test(ua)
        };
    },

    // Parse IP Address
    parseIP: (ip) => {
        // Remove IPv6 prefix if present
        return ip.replace('::ffff:', '');
    },

    // Parse Referrer
    parseReferrer: (referrer) => {
        if (!referrer) return { source: 'direct', medium: 'none' };
        
        try {
            const url = new URL(referrer);
            return {
                source: url.hostname,
                path: url.pathname,
                query: Object.fromEntries(url.searchParams),
                medium: url.hostname.includes('google') ? 'organic' : 'referral'
            };
        } catch {
            return { source: 'unknown', medium: 'direct' };
        }
    },

    // Parse Location from IP (using ipapi.co)
    parseLocation: async (ip) => {
        try {
            const response = await fetch(`https://ipapi.co/${ip}/json/`);
            const data = await response.json();
            return {
                country: data.country_name,
                countryCode: data.country_code,
                region: data.region,
                city: data.city,
                latitude: data.latitude,
                longitude: data.longitude,
                isp: data.org,
                timezone: data.timezone
            };
        } catch {
            return null;
        }
    }
};

// ============================================
// 🔐 ENCRYPTION UTILITIES
// ============================================
const Encryption = {
    // Hash password
    hashPassword: async (password) => {
        return await bcrypt.hash(password, 12);
    },

    // Compare password
    comparePassword: async (password, hash) => {
        return await bcrypt.compare(password, hash);
    },

    // Generate random string
    randomString: (length = 32) => {
        return crypto.randomBytes(length).toString('hex');
    },

    // Simple encryption (for sensitive data)
    encrypt: (text) => {
        const cipher = crypto.createCipher('aes-256-cbc', process.env.ENCRYPTION_KEY);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return encrypted;
    },

    // Decrypt
    decrypt: (encrypted) => {
        const decipher = crypto.createDecipher('aes-256-cbc', process.env.ENCRYPTION_KEY);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
};

// ============================================
// 📧 EMAIL SERVICE
// ============================================
const EmailService = {
    // Send Welcome Email
    sendWelcomeEmail: async (email, name) => {
        console.log(`📧 Welcome email sent to ${email}`);
        // Implement actual email sending logic here
    },

    // Send Approval Email
    sendApprovalEmail: async (email, name) => {
        console.log(`📧 Approval email sent to ${email}`);
    },

    // Send Password Reset Email
    sendPasswordResetEmail: async (email, token) => {
        console.log(`📧 Password reset email sent to ${email}`);
    }
};

// ============================================
// 📊 LOGGER
// ============================================
const Logger = {
    info: (message, data = {}) => {
        console.log(`ℹ️ [${new Date().toISOString()}] INFO: ${message}`, data);
    },

    warn: (message, data = {}) => {
        console.warn(`⚠️ [${new Date().toISOString()}] WARN: ${message}`, data);
    },

    error: (message, error = {}) => {
        console.error(`❌ [${new Date().toISOString()}] ERROR: ${message}`, error);
    },

    debug: (message, data = {}) => {
        if (process.env.NODE_ENV === 'development') {
            console.log(`🐛 [${new Date().toISOString()}] DEBUG: ${message}`, data);
        }
    }
};

// ============================================
// ⏱️ TIME UTILITIES
// ============================================
const TimeUtils = {
    // Get current timestamp
    now: () => new Date(),

    // Format date
    formatDate: (date, format = 'ISO') => {
        if (format === 'ISO') return date.toISOString();
        if (format === 'BD') return date.toLocaleString('bn-BD');
        return date.toString();
    },

    // Calculate time spent
    timeSpent: (startTime, endTime = new Date()) => {
        return Math.floor((endTime - startTime) / 1000);
    },

    // Check if date is today
    isToday: (date) => {
        const today = new Date();
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
    }
};

// ============================================
// ✅ VALIDATION FUNCTIONS
// ============================================
const Validator = {
    // Validate email
    isEmail: (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },

    // Validate phone (Bangladesh)
    isBDPhone: (phone) => {
        const re = /^(?:\+88|01)?\d{11}$/;
        return re.test(phone);
    },

    // Validate URL
    isURL: (url) => {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    },

    // Validate password strength
    isStrongPassword: (password) => {
        return password.length >= 8 &&
               /[A-Z]/.test(password) &&
               /[a-z]/.test(password) &&
               /[0-9]/.test(password);
    }
};

// ============================================
// 📤 EXPORT ALL UTILITIES
// ============================================
module.exports = {
    TokenGenerator,
    Parser,
    Encryption,
    EmailService,
    Logger,
    TimeUtils,
    Validator
};