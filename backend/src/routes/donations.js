const express = require('express');
const {
  createDonation,
  getDonationsByUser,
  getDonationsByNGO,
  updateDonation,
  getAvailableDonations
} = require('../controllers/donationController');
const { authenticateToken, userAndAbove, ngoAndAdmin, adminOnly } = require('../middleware/auth');
const { validateObjectId } = require('../middleware/validation');
const { 
  validateDonationCreation, 
  validateDonationUpdate, 
  checkDonationAccess,
  validateFreshness 
} = require('../middleware/donationValidation');

const router = express.Router();

// Authenticated routes

// Create donation (any authenticated user can donate)
router.post('/create', authenticateToken, userAndAbove, validateDonationCreation, validateFreshness, createDonation);

// Get available donations for NGOs to browse (public for map browsing)
router.get('/available', getAvailableDonations);

// Get donations by user ID (donor)
router.get('/user/:id', authenticateToken, validateObjectId('id'), getDonationsByUser);

// Get donations by NGO ID
router.get('/ngo/:id', authenticateToken, validateObjectId('id'), getDonationsByNGO);

// Update donation (donor, assigned NGO, or admin)
router.put('/update/:id', authenticateToken, validateObjectId('id'), validateDonationUpdate, updateDonation);

module.exports = router;
