/**
 * Validation middleware for donation-related requests
 */

const Donation = require('../models/Donation');

// Validate donation creation data
const validateDonationCreation = (req, res, next) => {
  const {
    foodItem,
    quantity,
    quantityUnit,
    cookedTime,
    expiryTime,
    location,
    photoURL,
    description,
    pickupInstructions
  } = req.body;

  const errors = [];

  // Food item validation
  if (!foodItem || typeof foodItem !== 'string') {
    errors.push('Food item is required and must be a string');
  } else if (foodItem.trim().length === 0) {
    errors.push('Food item cannot be empty');
  } else if (foodItem.trim().length > 100) {
    errors.push('Food item name cannot exceed 100 characters');
  }

  // Quantity validation
  if (!quantity || typeof quantity !== 'number') {
    errors.push('Quantity is required and must be a number');
  } else if (quantity < 1) {
    errors.push('Quantity must be at least 1');
  } else if (quantity > 1000) {
    errors.push('Quantity cannot exceed 1000');
  }

  // Quantity unit validation
  if (quantityUnit && !['servings', 'plates', 'boxes', 'kg', 'pieces'].includes(quantityUnit)) {
    errors.push('Invalid quantity unit. Must be: servings, plates, boxes, kg, or pieces');
  }

  // Cooked time validation
  if (!cookedTime) {
    errors.push('Cooked time is required');
  } else {
    const cookedTimeDate = new Date(cookedTime);
    const now = new Date();
    
    if (isNaN(cookedTimeDate.getTime())) {
      errors.push('Invalid cooked time format');
    } else if (cookedTimeDate > now) {
      errors.push('Cooked time cannot be in the future');
    } else {
      // Check if food is too old (more than 24 hours)
      const timeDiff = now - cookedTimeDate;
      const hoursDiff = timeDiff / (1000 * 60 * 60);
      
      if (hoursDiff > 24) {
        errors.push('Food is too old. Maximum age allowed is 24 hours.');
      }
    }
  }

  // Expiry time validation (optional)
  if (expiryTime) {
    const expiryTimeDate = new Date(expiryTime);
    const cookedTimeDate = new Date(cookedTime);
    
    if (isNaN(expiryTimeDate.getTime())) {
      errors.push('Invalid expiry time format');
    } else if (expiryTimeDate <= cookedTimeDate) {
      errors.push('Expiry time must be after cooked time');
    }
  }

  // Location validation
  if (!location) {
    errors.push('Location is required');
  } else {
    const { lat, lng, address, city } = location;
    
    if (typeof lat !== 'number' || lat < -90 || lat > 90) {
      errors.push('Latitude must be a number between -90 and 90');
    }
    
    if (typeof lng !== 'number' || lng < -180 || lng > 180) {
      errors.push('Longitude must be a number between -180 and 180');
    }
    
    if (!address || typeof address !== 'string' || address.trim().length === 0) {
      errors.push('Address is required and must be a non-empty string');
    } else if (address.trim().length > 200) {
      errors.push('Address cannot exceed 200 characters');
    }
    
    if (!city || typeof city !== 'string' || city.trim().length === 0) {
      errors.push('City is required and must be a non-empty string');
    } else if (city.trim().length > 50) {
      errors.push('City name cannot exceed 50 characters');
    }
  }

  // Photo URL validation (optional)
  if (photoURL) {
    if (typeof photoURL !== 'string') {
      errors.push('Photo URL must be a string');
    } else if (!/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(photoURL)) {
      errors.push('Photo URL must be a valid image URL (jpg, jpeg, png, gif, webp)');
    }
  }

  // Description validation (optional)
  if (description && (typeof description !== 'string' || description.trim().length > 500)) {
    errors.push('Description cannot exceed 500 characters');
  }

  // Pickup instructions validation (optional)
  if (pickupInstructions && (typeof pickupInstructions !== 'string' || pickupInstructions.trim().length > 300)) {
    errors.push('Pickup instructions cannot exceed 300 characters');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      message: 'Validation failed',
      errors
    });
  }

  // Sanitize data
  req.body.foodItem = foodItem.trim();
  req.body.location.address = location.address.trim();
  req.body.location.city = location.city.trim();
  if (description) req.body.description = description.trim();
  if (pickupInstructions) req.body.pickupInstructions = pickupInstructions.trim();

  next();
};

// Validate donation update data
const validateDonationUpdate = (req, res, next) => {
  const { status, notes, ngoId } = req.body;
  const errors = [];

  // Status validation
  if (status) {
    const validStatuses = ['pending', 'assigned', 'picked', 'delivered', 'expired', 'cancelled'];
    if (!validStatuses.includes(status)) {
      errors.push(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }
  }

  // ngoId validation (optional)
  if (ngoId !== undefined && ngoId !== null) {
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    if (typeof ngoId !== 'string' || !objectIdRegex.test(ngoId)) {
      errors.push('ngoId must be a valid Mongo ObjectId string or null');
    }
  }

  // Notes validation (optional)
  if (notes && (typeof notes !== 'string' || notes.trim().length === 0)) {
    errors.push('Notes must be a non-empty string');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      message: 'Validation failed',
      errors
    });
  }

  // Sanitize data
  if (notes) req.body.notes = notes.trim();

  next();
};

// Check if user can access donation
const checkDonationAccess = async (req, res, next) => {
  try {
    const { id } = req.params;
    const donation = await Donation.findById(id);

    if (!donation) {
      return res.status(404).json({
        message: 'Donation not found'
      });
    }

    // Check access permissions
    const canAccess = 
      donation.donorId.toString() === req.user._id.toString() || // Donor
      donation.ngoId?.toString() === req.user._id.toString() || // Assigned NGO
      req.user.role === 'admin'; // Admin

    if (!canAccess) {
      return res.status(403).json({
        message: 'Access denied. You cannot access this donation.'
      });
    }

    req.donation = donation;
    next();
  } catch (error) {
    console.error('Donation access check error:', error);
    res.status(500).json({
      message: 'Failed to verify donation access',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Validate freshness of donation
const validateFreshness = async (req, res, next) => {
  try {
    const { cookedTime } = req.body;
    
    if (cookedTime) {
      const cookedTimeDate = new Date(cookedTime);
      const now = new Date();
      const timeDiff = now - cookedTimeDate;
      const hoursDiff = timeDiff / (1000 * 60 * 60);
      
      if (hoursDiff > 24) {
        return res.status(400).json({
          message: 'Food is too old. Maximum age allowed is 24 hours.',
          hoursOld: Math.floor(hoursDiff)
        });
      }
    }
    
    next();
  } catch (error) {
    console.error('Freshness validation error:', error);
    res.status(500).json({
      message: 'Failed to validate freshness',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  validateDonationCreation,
  validateDonationUpdate,
  checkDonationAccess,
  validateFreshness
};
