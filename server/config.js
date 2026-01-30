require('dotenv').config();

module.exports = {
    PORT: process.env.PORT || 3001,
    JWT_SECRET: process.env.JWT_SECRET || 'ilovespsr_nellore_secret_key_2026_secure',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
    DB_PATH: process.env.DB_PATH || './server/db/nellore.db',
    BCRYPT_ROUNDS: 12,
    RATE_LIMIT: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100 // limit each IP to 100 requests per windowMs
    },
    CORS_ORIGIN: process.env.CORS_ORIGIN || '*'
};
