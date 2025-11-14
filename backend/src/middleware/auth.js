const User = require('../models/User');
const { verifyToken, extractTokenFromHeader } = require('../utils/jwt');

// Verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return res.status(401).json({ 
        message: 'Access token required',
        code: 'TOKEN_MISSING'
      });
    }

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        message: 'Invalid token - user not found',
        code: 'USER_NOT_FOUND'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({ 
        message: 'Account is deactivated',
        code: 'ACCOUNT_DEACTIVATED'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Invalid token',
        code: 'TOKEN_INVALID'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    if (error.name === 'NotBeforeError') {
      return res.status(401).json({ 
        message: 'Token not active yet',
        code: 'TOKEN_NOT_ACTIVE'
      });
    }
    console.error('Token verification error:', error);
    res.status(500).json({ 
      message: 'Token verification failed',
      code: 'TOKEN_VERIFICATION_FAILED'
    });
  }
};

// Check user role
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!req.user.isActive) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Access denied. Required roles: ${roles.join(', ')}` 
      });
    }

    next();
  };
};

// Admin only middleware
const adminOnly = authorize('admin');

// NGO and Admin middleware
const ngoAndAdmin = authorize('ngo', 'admin');

// All authenticated users middleware
const userAndAbove = authorize('user', 'ngo', 'admin');

module.exports = {
  authenticateToken,
  authorize,
  adminOnly,
  ngoAndAdmin,
  userAndAbove
};
