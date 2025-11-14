const Donation = require('../models/Donation');
const User = require('../models/User');
const { assignOptimalNGO } = require('../utils/ngoAssignment');

/**
 * Create a new donation
 */
const createDonation = async (req, res) => {
  try {
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

    const donorId = req.user._id;

    // Validate required fields
    if (!foodItem || !quantity || !cookedTime || !location) {
      return res.status(400).json({
        message: 'Missing required fields: foodItem, quantity, cookedTime, location'
      });
    }

    // Validate location
    if (!location.lat || !location.lng || !location.address || !location.city) {
      return res.status(400).json({
        message: 'Location must include lat, lng, address, and city'
      });
    }

    // Validate cooked time (cannot be in the future)
    const cookedTimeDate = new Date(cookedTime);
    const now = new Date();
    
    if (cookedTimeDate > now) {
      return res.status(400).json({
        message: 'Cooked time cannot be in the future'
      });
    }

    // Check freshness (max 24 hours old)
    const timeDiff = now - cookedTimeDate;
    const hoursDiff = timeDiff / (1000 * 60 * 60);
    
    if (hoursDiff > 24) {
      return res.status(400).json({
        message: 'Food is too old. Maximum age allowed is 24 hours.'
      });
    }

    // Create donation
    const donation = new Donation({
      donorId,
      foodItem,
      quantity,
      quantityUnit: quantityUnit || 'servings',
      cookedTime: cookedTimeDate,
      expiryTime: expiryTime ? new Date(expiryTime) : undefined,
      location,
      photoURL,
      description,
      pickupInstructions,
      status: 'pending'
    });

    await donation.save();

    // Auto-assign NGO using optimal assignment algorithm
    const assignment = await assignOptimalNGO(donation);
    if (assignment) {
      donation.ngoId = assignment.ngo._id;
      donation.status = 'assigned';
      donation.assignedAt = new Date();
      await donation.save();
    }

    // Populate donor information
    await donation.populate('donorId', 'name email role');
    if (donation.ngoId) {
      await donation.populate('ngoId', 'name email role');
    }

    res.status(201).json({
      message: 'Donation created successfully',
      donation
    });

  } catch (error) {
    console.error('Create donation error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        message: 'Validation failed',
        errors: messages
      });
    }

    res.status(500).json({
      message: 'Failed to create donation',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get donations by user ID (donor)
 */
const getDonationsByUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, page = 1, limit = 10 } = req.query;

    // Check if user is requesting their own donations or has admin access
    if (req.user._id.toString() !== id && req.user.role !== 'admin') {
      return res.status(403).json({
        message: 'Access denied. You can only view your own donations.'
      });
    }

    const query = { donorId: id };
    if (status) {
      query.status = status;
    }

    const donations = await Donation.find(query)
      .populate('ngoId', 'name email role')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Donation.countDocuments(query);

    res.json({
      message: 'Donations retrieved successfully',
      donations,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Get donations by user error:', error);
    res.status(500).json({
      message: 'Failed to retrieve donations',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get donations by NGO ID
 */
const getDonationsByNGO = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, page = 1, limit = 10 } = req.query;

    // Check if user is requesting their own NGO donations or has admin access
    if (req.user._id.toString() !== id && req.user.role !== 'admin') {
      return res.status(403).json({
        message: 'Access denied. You can only view your own NGO donations.'
      });
    }

    const query = { ngoId: id };
    if (status) {
      query.status = status;
    }

    const donations = await Donation.find(query)
      .populate('donorId', 'name email role')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Donation.countDocuments(query);

    res.json({
      message: 'NGO donations retrieved successfully',
      donations,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Get donations by NGO error:', error);
    res.status(500).json({
      message: 'Failed to retrieve NGO donations',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Update donation status
 */
const updateDonation = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, ngoId } = req.body;

    const donation = await Donation.findById(id);
    if (!donation) {
      return res.status(404).json({
        message: 'Donation not found'
      });
    }

    // Check permissions
    const canUpdate = 
      donation.donorId.toString() === req.user._id.toString() || // Donor can update
      donation.ngoId?.toString() === req.user._id.toString() || // Assigned NGO can update
      req.user.role === 'admin'; // Admin can update

    if (!canUpdate) {
      return res.status(403).json({
        message: 'Access denied. You cannot update this donation.'
      });
    }

    // Validate status transitions
    if (status && !isValidStatusTransition(donation.status, status)) {
      return res.status(400).json({
        message: `Invalid status transition from ${donation.status} to ${status}`
      });
    }

    // Update donation
    const updateData = {};
    if (status) {
      updateData.status = status;
      
      // Set timestamps based on status
      switch (status) {
        case 'assigned':
          updateData.assignedAt = new Date();
          break;
        case 'picked':
          updateData.pickedAt = new Date();
          break;
        case 'delivered':
          updateData.deliveredAt = new Date();
          break;
      }
    }

    // Allow setting or clearing NGO assignment when moving to assigned/pending
    if (ngoId !== undefined) {
      updateData.ngoId = ngoId || undefined;
      if (!status && (ngoId || donation.ngoId)) {
        // if ngoId provided without status, ensure status assigned
        updateData.status = ngoId ? 'assigned' : 'pending';
      }
    }

    if (notes) {
      updateData.$push = {
        notes: {
          text: notes,
          addedBy: req.user._id,
          addedAt: new Date()
        }
      };
    }

    const updatedDonation = await Donation.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('donorId', 'name email role')
     .populate('ngoId', 'name email role');

    res.json({
      message: 'Donation updated successfully',
      donation: updatedDonation
    });

  } catch (error) {
    console.error('Update donation error:', error);
    res.status(500).json({
      message: 'Failed to update donation',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get all available donations (for NGOs to browse)
 */
const getAvailableDonations = async (req, res) => {
  try {
    const { lat, lng, maxDistance = 10, page = 1, limit = 10 } = req.query;

    if (lat === undefined || lng === undefined) {
      return res.status(400).json({
        message: 'Latitude and longitude are required'
      });
    }

    const query = {
      status: 'pending',
      expiryTime: { $gt: new Date() } // Only fresh donations
    };

    let donations = await Donation.find(query)
      .populate('donorId', 'name email role')
      .sort({ createdAt: -1 });

    // Filter by distance if coordinates provided
    if (lat !== undefined && lng !== undefined) {
      donations = donations.filter(donation => {
        const distance = donation.distanceFrom(parseFloat(lat), parseFloat(lng));
        return distance <= parseFloat(maxDistance);
      });
    }

    // Apply pagination
    const total = donations.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    donations = donations.slice(startIndex, endIndex);

    res.json({
      message: 'Available donations retrieved successfully',
      donations,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Get available donations error:', error);
    res.status(500).json({
      message: 'Failed to retrieve available donations',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};


/**
 * Validate status transition
 */
const isValidStatusTransition = (currentStatus, newStatus) => {
  const validTransitions = {
    'pending': ['assigned', 'cancelled', 'expired'],
    'assigned': ['picked', 'cancelled', 'expired'],
    'picked': ['delivered', 'cancelled'],
    'delivered': [], // Final state
    'expired': [], // Final state
    'cancelled': [] // Final state
  };

  return validTransitions[currentStatus]?.includes(newStatus) || false;
};

module.exports = {
  createDonation,
  getDonationsByUser,
  getDonationsByNGO,
  updateDonation,
  getAvailableDonations
};
