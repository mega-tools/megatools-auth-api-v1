// ============================================
// 🚀 MEGATOOLS AUTH API v5.0 - ENTERPRISE EDITION
// File 1/5: Main Server + Configuration
// ============================================

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

const app = express();

// ============================================
// 🔐 ENVIRONMENT VARIABLES
// ============================================
const ENV = {
    PORT: process.env.PORT || 5000,
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/megatools',
    JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-2024',
    JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',
    API_KEY: process.env.API_KEY || 'megatools-api-key-2024',
    NODE_ENV: process.env.NODE_ENV || 'development',
    RATE_LIMIT_WINDOW: process.env.RATE_LIMIT_WINDOW || 15 * 60 * 1000,
    RATE_LIMIT_MAX: process.env.RATE_LIMIT_MAX || 100,
    EMAIL_HOST: process.env.EMAIL_HOST || 'smtp.gmail.com',
    EMAIL_PORT: process.env.EMAIL_PORT || 587,
    EMAIL_USER: process.env.EMAIL_USER || '',
    EMAIL_PASS: process.env.EMAIL_PASS || ''
};

// ============================================
// 🛡️ SECURITY MIDDLEWARES
// ============================================
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));
app.use(compression());
app.use(cors({
    origin: ['http://localhost:3000', 'https://your-dashboard.com', '*'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Master-ID']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static('uploads'));

// Rate Limiting
const limiter = rateLimit({
    windowMs: ENV.RATE_LIMIT_WINDOW,
    max: ENV.RATE_LIMIT_MAX,
    message: { success: false, error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', limiter);

// ============================================
// 🗄️ DATABASE CONNECTION
// ============================================
mongoose.connect(ENV.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB Connected Successfully'))
.catch(err => {
    console.error('❌ MongoDB Connection Error:', err);
    process.exit(1);
});

// ============================================
// 📤 IMPORT ROUTES - এই লাইনটা ঠিক করলাম
// ============================================
const routes = require('./routes');  // ← এখন ঠিক আছে (4 সরিয়ে দিয়েছি)
app.use('/', routes);

// ============================================
// 🏥 HEALTH CHECK
// ============================================
app.get('/health', (req, res) => {
    res.json({
        success: true,
        service: 'MegaTools Auth API v5.0',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: ENV.NODE_ENV,
        memory: process.memoryUsage(),
        version: '5.0.0'
    });
});

// ============================================
// ❌ 404 HANDLER
// ============================================
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'API endpoint not found',
        availableEndpoints: '/api-docs or /health'
    });
});

// ============================================
// 🚨 ERROR HANDLER
// ============================================
app.use((err, req, res, next) => {
    console.error('🔥 Server Error:', err);
    res.status(err.status || 500).json({
        success: false,
        error: ENV.NODE_ENV === 'development' ? err.message : 'Internal server error',
        code: err.code || 'INTERNAL_ERROR',
        timestamp: new Date().toISOString()
    });
});

// ============================================
// 🚀 START SERVER
// ============================================
app.listen(ENV.PORT, () => {
    console.log(`✅ Server running on port ${ENV.PORT}`);
    console.log(`📍 Environment: ${ENV.NODE_ENV}`);
    console.log(`📡 API: http://localhost:${ENV.PORT}/api`);
});

module.exports = app;
