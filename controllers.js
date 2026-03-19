// ============================================
// 🎮 MEGATOOLS CONTROLLERS
// File 3/5: All Business Logic (FIXED)
// ============================================

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const Models = require('./models');  // ← এটা ঠিক করলাম (2.models → models)

const { User, Campaign, Visitor, Referral, Submission, Log, Settings } = Models;

// ============================================
// 🔐 AUTH CONTROLLER (COMPLETE)
// ============================================
const AuthController = {
    // Login
    login: async (req, res) => {
        try {
            const { email, password } = req.body;
            
            const user = await User.findOne({ 
                $or: [{ email }, { username: email }] 
            });
            
            if (!user) {
                return res.status(401).json({ 
                    success: false, 
                    error: 'Invalid credentials' 
                });
            }
            
            if (user.status === 'suspended' || user.status === 'banned') {
                return res.status(403).json({ 
                    success: false, 
                    error: 'Account is suspended' 
                });
            }
            
            const isValid = await user.comparePassword(password);
            if (!isValid) {
                user.loginAttempts += 1;
                if (user.loginAttempts >= 5) {
                    user.lockUntil = new Date(Date.now() + 30 * 60000);
                }
                await user.save();
                
                return res.status(401).json({ 
                    success: false, 
                    error: 'Invalid credentials' 
                });
            }
            
            // Reset login attempts
            user.loginAttempts = 0;
            user.lockUntil = null;
            user.lastLogin = new Date();
            await user.save();
            
            const token = jwt.sign(
                { 
                    id: user._id, 
                    masterId: user.masterId, 
                    role: user.role,
                    email: user.email 
                },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRE }
            );
            
            await Log.create({
                level: 'info',
                action: 'LOGIN_SUCCESS',
                userId: user.masterId,
                ip: req.ip,
                userAgent: req.headers['user-agent']
            });
            
            res.json({
                success: true,
                token,
                user: {
                    masterId: user.masterId,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    profile: user.profile,
                    status: user.status,
                    referral: user.referral,
                    settings: user.settings
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },

    // Register with Referral
    register: async (req, res) => {
        try {
            const { username, email, password, referralCode } = req.body;
            
            if (!referralCode) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Referral code is required' 
                });
            }
            
            // Check if user exists
            const existingUser = await User.findOne({ 
                $or: [{ email }, { username }] 
            });
            if (existingUser) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'User already exists' 
                });
            }
            
            // Validate referral
            const referral = await Referral.findOne({ 
                code: referralCode, 
                status: 'active' 
            }).populate('ownerMasterId');
            
            if (!referral) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Invalid referral code' 
                });
            }
            
            if (referral.uses >= referral.maxUses) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Referral code expired' 
                });
            }
            
            // Determine role based on referrer
            let role = 'user';
            const referrer = await User.findOne({ masterId: referral.ownerMasterId });
            
            if (referrer.role === 'admin') role = 'moderator';
            else if (referrer.role === 'moderator') role = 'user';
            
            // Create master ID
            const masterId = 'MK_' + crypto.randomBytes(4).toString('hex').toUpperCase();
            
            // Create user
            const user = new User({
                masterId,
                username,
                email,
                password,
                role,
                status: 'pending',
                'referral.code': crypto.randomBytes(4).toString('hex').toUpperCase(),
                'referral.referredBy': referral.ownerMasterId
            });
            
            await user.save();
            
            // Update referral
            referral.uses += 1;
            referral.referredUsers.push(user.masterId);
            await referral.save();
            
            // Update referrer's stats
            referrer.referral.referredUsers.push(user.masterId);
            await referrer.save();
            
            await Log.create({
                level: 'info',
                action: 'REGISTER_SUCCESS',
                userId: user.masterId,
                ip: req.ip,
                data: { referredBy: referral.ownerMasterId }
            });
            
            res.json({
                success: true,
                message: 'Registration successful. Waiting for approval.',
                masterId: user.masterId
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },

    // Get Current User
    me: async (req, res) => {
        try {
            const user = await User.findOne({ masterId: req.user.masterId })
                .select('-password -twoFactorSecret');
            
            res.json({ success: true, user });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },

    // Refresh Token
    refreshToken: async (req, res) => {
        try {
            const { refreshToken } = req.body;
            
            const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id);
            
            if (!user) {
                return res.status(401).json({ 
                    success: false, 
                    error: 'Invalid refresh token' 
                });
            }
            
            const newToken = jwt.sign(
                { 
                    id: user._id, 
                    masterId: user.masterId, 
                    role: user.role 
                },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRE }
            );
            
            res.json({ success: true, token: newToken });
        } catch (error) {
            res.status(401).json({ success: false, error: 'Invalid refresh token' });
        }
    },

    // Change Password
    changePassword: async (req, res) => {
        try {
            const { currentPassword, newPassword } = req.body;
            
            const user = await User.findOne({ masterId: req.user.masterId });
            
            const isValid = await user.comparePassword(currentPassword);
            if (!isValid) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Current password is incorrect' 
                });
            }
            
            user.password = newPassword;
            await user.save();
            
            res.json({ success: true, message: 'Password changed successfully' });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
};

// ============================================
// 👤 USER CONTROLLER
// ============================================
const UserController = {
    // Update Profile
    updateProfile: async (req, res) => {
        try {
            const updates = req.body;
            
            const user = await User.findOne({ masterId: req.user.masterId });
            
            // Update profile fields
            if (updates.fullName) user.profile.fullName = updates.fullName;
            if (updates.phone) user.profile.phone = updates.phone;
            if (updates.facebook) user.profile.facebook = updates.facebook;
            if (updates.telegram) user.profile.telegram = updates.telegram;
            if (updates.whatsapp) user.profile.whatsapp = updates.whatsapp;
            if (updates.country) user.profile.country = updates.country;
            if (updates.timezone) user.profile.timezone = updates.timezone;
            
            // Update settings
            if (updates.settings) {
                user.settings = { ...user.settings, ...updates.settings };
            }
            
            await user.save();
            
            res.json({ 
                success: true, 
                message: 'Profile updated successfully',
                profile: user.profile
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },

    // Get Referral Link
    getReferralLink: async (req, res) => {
        try {
            const user = await User.findOne({ masterId: req.user.masterId });
            
            let referral = await Referral.findOne({ ownerMasterId: user.masterId });
            
            if (!referral) {
                const code = crypto.randomBytes(3).toString('hex').toUpperCase();
                referral = new Referral({
                    code,
                    ownerMasterId: user.masterId,
                    type: user.role === 'admin' ? 'admin_to_moderator' : 'moderator_to_user',
                    maxUses: user.role === 'admin' ? 50 : 10
                });
                await referral.save();
            }
            
            const referralLink = `https://yourapi.com/signup?ref=${referral.code}`;
            
            res.json({
                success: true,
                referralLink,
                code: referral.code,
                uses: referral.uses,
                maxUses: referral.maxUses,
                referredUsers: referral.referredUsers
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },

    // Get All Users (Admin only)
    getAllUsers: async (req, res) => {
        try {
            const { page = 1, limit = 50, role, status, search } = req.query;
            
            const query = {};
            if (role) query.role = role;
            if (status) query.status = status;
            if (search) {
                query.$or = [
                    { username: new RegExp(search, 'i') },
                    { email: new RegExp(search, 'i') },
                    { masterId: new RegExp(search, 'i') }
                ];
            }
            
            const users = await User.find(query)
                .select('-password -twoFactorSecret')
                .limit(limit * 1)
                .skip((page - 1) * limit)
                .sort({ createdAt: -1 });
            
            const total = await User.countDocuments(query);
            
            res.json({
                success: true,
                users,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },

    // Approve User (Admin/Moderator)
    approveUser: async (req, res) => {
        try {
            const { masterId } = req.params;
            
            const user = await User.findOne({ masterId });
            if (!user) {
                return res.status(404).json({ 
                    success: false, 
                    error: 'User not found' 
                });
            }
            
            user.status = 'active';
            user.approval.approvedBy = req.user.masterId;
            user.approval.approvedAt = new Date();
            user.apiKey = 'mk_' + crypto.randomBytes(24).toString('hex');
            
            await user.save();
            
            res.json({ 
                success: true, 
                message: 'User approved successfully',
                apiKey: user.apiKey 
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
};

// ============================================
// 📢 CAMPAIGN CONTROLLER
// ============================================
const CampaignController = {
    // Create Campaign
    createCampaign: async (req, res) => {
        try {
            const { name, urls, rotation } = req.body;
            
            const campaignId = 'CAMP_' + crypto.randomBytes(4).toString('hex').toUpperCase();
            
            const campaign = new Campaign({
                campaignId,
                name,
                ownerMasterId: req.user.masterId,
                urls,
                currentUrl: urls.entry,
                rotation: rotation || { type: 'manual' }
            });
            
            await campaign.save();
            
            // Update user stats
            await User.findOneAndUpdate(
                { masterId: req.user.masterId },
                { $inc: { 'stats.totalCampaigns': 1 } }
            );
            
            res.json({ success: true, campaign });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },

    // Get Campaigns
    getCampaigns: async (req, res) => {
        try {
            const { status, page = 1, limit = 50 } = req.query;
            
            let query = {};
            
            if (req.user.role === 'user') {
                query.ownerMasterId = req.user.masterId;
            } else if (req.user.role === 'moderator') {
                const user = await User.findOne({ masterId: req.user.masterId });
                query.ownerMasterId = { 
                    $in: [req.user.masterId, ...user.referral.referredUsers] 
                };
            }
            
            if (status) query.status = status;
            
            const campaigns = await Campaign.find(query)
                .limit(limit * 1)
                .skip((page - 1) * limit)
                .sort({ createdAt: -1 });
            
            const total = await Campaign.countDocuments(query);
            
            res.json({
                success: true,
                campaigns,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },

    // Update Campaign URL
    updateCampaignUrl: async (req, res) => {
        try {
            const { campaignId } = req.params;
            const { urlType, newUrl } = req.body;
            
            const campaign = await Campaign.findOne({ campaignId });
            
            if (!campaign) {
                return res.status(404).json({ 
                    success: false, 
                    error: 'Campaign not found' 
                });
            }
            
            // Check permission
            if (req.user.role !== 'admin' && campaign.ownerMasterId !== req.user.masterId) {
                return res.status(403).json({ 
                    success: false, 
                    error: 'Access denied' 
                });
            }
            
            // Update URL based on type
            if (urlType === 'current') {
                campaign.currentUrl = newUrl;
            } else if (campaign.urls[urlType]) {
                campaign.urls[urlType] = newUrl;
            }
            
            campaign.updatedAt = new Date();
            await campaign.save();
            
            res.json({ success: true, campaign });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
};

// ============================================
// 📥 TRACKING CONTROLLER
// ============================================
const TrackingController = {
    // Track Entry (External Link)
    trackEntry: async (req, res) => {
        try {
            const { campaignId, uid } = req.params;
            const sessionId = uid || 'SESS_' + crypto.randomBytes(8).toString('hex');
            
            // Get campaign
            const campaign = await Campaign.findOne({ campaignId });
            if (!campaign) {
                return res.redirect('/404');
            }
            
            // Create or update visitor
            let visitor = await Visitor.findOne({ sessionId });
            
            if (!visitor) {
                visitor = new Visitor({
                    sessionId,
                    masterId: uid || sessionId,
                    campaignId,
                    auto: {
                        ip: req.ip,
                        userAgent: req.headers['user-agent'],
                        referrer: req.headers.referer,
                        ...req.query
                    },
                    entryPage: req.headers.referer || 'direct',
                    currentPage: campaign.currentUrl
                });
                
                // Update campaign stats
                campaign.stats.visitors += 1;
                await campaign.save();
            } else {
                visitor.lastSeen = new Date();
                visitor.timeSpent += 5;
            }
            
            await visitor.save();
            
            // Redirect to current URL
            const redirectUrl = campaign.currentUrl + 
                (campaign.currentUrl.includes('?') ? '&' : '?') + 
                `sid=${sessionId}`;
            
            res.redirect(302, redirectUrl);
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },

    // Submit Data
    submitData: async (req, res) => {
        try {
            const { sessionId, type, data } = req.body;
            
            const submission = new Submission({
                submissionId: 'SUB_' + crypto.randomBytes(6).toString('hex'),
                sessionId,
                type,
                data,
                metadata: {
                    ip: req.ip,
                    userAgent: req.headers['user-agent'],
                    timestamp: new Date()
                }
            });
            
            await submission.save();
            
            // Update visitor
            await Visitor.findOneAndUpdate(
                { sessionId },
                { 
                    $push: { submissions: { type, data, timestamp: new Date() } },
                    $set: { lastSeen: new Date() }
                }
            );
            
            res.json({ success: true, submissionId: submission.submissionId });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
};

// ============================================
// 📊 DASHBOARD CONTROLLER
// ============================================
const DashboardController = {
    // Get Real-time Stats
    getRealtimeStats: async (req, res) => {
        try {
            const now = new Date();
            const fiveMinAgo = new Date(now - 5 * 60000);
            
            let visitorQuery = {};
            if (req.user.role === 'user') {
                const campaigns = await Campaign.find({ ownerMasterId: req.user.masterId });
                visitorQuery.campaignId = { $in: campaigns.map(c => c.campaignId) };
            }
            
            const [activeVisitors, todayVisitors, totalVisitors, recentSubmissions] = 
                await Promise.all([
                    Visitor.countDocuments({ 
                        ...visitorQuery, 
                        lastSeen: { $gte: fiveMinAgo },
                        status: 'active'
                    }),
                    Visitor.countDocuments({ 
                        ...visitorQuery, 
                        firstSeen: { $gte: new Date().setHours(0,0,0,0) }
                    }),
                    Visitor.countDocuments(visitorQuery),
                    Submission.find()
                        .sort({ createdAt: -1 })
                        .limit(10)
                ]);
            
            res.json({
                success: true,
                stats: {
                    activeVisitors,
                    todayVisitors,
                    totalVisitors,
                    recentSubmissions
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
};

// ============================================
// 📤 EXPORT ALL CONTROLLERS
// ============================================
module.exports = {
    AuthController,
    UserController,
    CampaignController,
    TrackingController,
    DashboardController
};
