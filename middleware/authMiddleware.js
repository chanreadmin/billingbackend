// /middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import { jwtConfig } from '../config/jwt.js';

// Middleware to verify JWT token
export const authenticateJWT = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Access denied, no token provided' });
  }
  try {
    const decoded = jwt.verify(token, jwtConfig.secret);
    req.user = decoded; 
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token, access denied' });
  }
};

// Middleware for Role-Based Access Control (RBAC)
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied, insufficient permissions' });
    }
    next();
  };
};



