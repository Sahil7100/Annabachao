const express = require('express');
const { authenticateToken, adminOnly, ngoAndAdmin, userAndAbove } = require('../middleware/auth');
const { validateObjectId } = require('../middleware/validation');
const {
  getDashboardStats,
  reassignDonations,
  getNGOStats,
  batchAssign,
  getAllDonations,
  updateDonationStatus,
  compareAlgorithms
} = require('../controllers/adminController');

const router = express.Router();

// All admin routes require authentication
router.use(authenticateToken);

// Admin dashboard with statistics
router.get('/dashboard', adminOnly, getDashboardStats);

// Admin dashboard info (legacy endpoint)
router.get('/dashboard-info', adminOnly, (req, res) => {
  res.json({
    message: 'Welcome to admin dashboard',
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

// NGO and Admin access
router.get('/ngo-management', ngoAndAdmin, (req, res) => {
  res.json({
    message: 'NGO management panel',
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

// All authenticated users
router.get('/profile', userAndAbove, (req, res) => {
  res.json({
    message: 'User profile accessed',
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

// Test role-based access
router.get('/test-roles', (req, res) => {
  const { role } = req.user;
  let message = '';
  
  switch (role) {
    case 'admin':
      message = 'You have full access to all features';
      break;
    case 'ngo':
      message = 'You can manage food donations and NGO operations';
      break;
    case 'user':
      message = 'You can browse and request food donations';
      break;
    default:
      message = 'Unknown role';
  }

  res.json({
    message,
    userRole: role,
    permissions: {
      canManageUsers: role === 'admin',
      canManageDonations: ['admin', 'ngo'].includes(role),
      canRequestFood: ['user', 'ngo', 'admin'].includes(role),
      canViewReports: ['admin', 'ngo'].includes(role)
    },
    timestamp: new Date().toISOString()
  });
});

// Admin-only donation management routes
router.get('/donations', adminOnly, getAllDonations);
router.put('/donations/:id/status', adminOnly, validateObjectId('id'), updateDonationStatus);
router.post('/donations/batch-assign', adminOnly, batchAssign);
router.post('/donations/reassign', adminOnly, reassignDonations);

// NGO statistics
router.get('/ngo/:id/stats', adminOnly, validateObjectId('id'), getNGOStats);

// Algorithm comparison
router.post('/compare-algorithms', adminOnly, compareAlgorithms);

module.exports = router;
