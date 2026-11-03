// Runs before every test file: gives the env validator valid values without a real .env.
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'mongodb://localhost:27017/mahastays_test?replicaSet=rs0&directConnection=true';
process.env.JWT_ACCESS_SECRET = 'test-jwt-secret-test-jwt-secret-1234567890';
process.env.ENCRYPTION_KEY = 'test-encryption-key-test-encryption-key-123';
process.env.BCRYPT_ROUNDS = '4';
process.env.PAYMENT_GATEWAY = 'mock';
process.env.ENABLE_JOBS = 'false';
process.env.LOG_LEVEL = 'silent';
