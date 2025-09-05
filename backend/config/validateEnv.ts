const validateEnv = () => {
    const requiredEnvVars = [
        'MONGO_URI',
        'JWT_SECRET',
        'PORT',
        'EMAIL_HOST',
        'EMAIL_PORT',
        'EMAIL_USER',
        'EMAIL_PASS',
    ];

    for (const envVar of requiredEnvVars) {
        if (!process.env[envVar]) {
            throw new Error(`Missing required environment variable: ${envVar}`);
        }
    }
};

export default validateEnv;
