// /config/jwt.js
export const jwtConfig = {
    secret: process.env.JWT_SECRET || 'your_jwt_secret_key', // Should come from env variable
    expiresIn: '1h',
  };
  