const validateEnv = () => {
    const requiredEnvVars = [
        'VITE_API_BASE_URL',
    ];

    for (const envVar of requiredEnvVars) {
        if (!import.meta.env[envVar]) {
            throw new Error(`Missing required environment variable: ${envVar}`);
        }
    }
};

export default validateEnv;
