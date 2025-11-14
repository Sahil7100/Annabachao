const Donation = require('../models/Donation');
const User = require('../models/User');
const { 
  reassignFailedDonations, 
  getNGOAssignmentStats, 
  batchAssignNGOs,
  compareAssignmentMethods
} = require('../utils/ngoAssignment');

/**
 * Get dashboard statistics
 */
const getDashboardStats = async (req, res) => {
  try {
    const totalDonations = await Donation.countDocuments();
    const pendingDonations = await Donation.countDocuments({ status: 'pending' });
    const assignedDonations = await Donation.countDocuments({ status: 'assigned' });
    const deliveredDonations = await Donation.countDocuments({ status: 'delivered' });
    const expiredDonations = await Donation.countDocuments({ status: 'expired' });

    const totalUsers = await User.countDocuments();
    const totalNGOs = await User.countDocuments({ role: 'ngo' });
    const activeNGOs = await User.countDocuments({ role: 'ngo', isActive: true });

    // Recent donations (last 7 days)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentDonations = await Donation.countDocuments({
      createdAt: { $gte: weekAgo }
    });

    // Top performing NGOs
    const topNGOs = await Donation.aggregate([
      { $match: { ngoId: { $exists: true }, status: 'delivered' } },
      {
        $group: {
          _id: '$ngoId',
          deliveredCount: { $sum: 1 }
        }
      },
      { $sort: { deliveredCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'ngo'
        }
      },
      { $unwind: '$ngo' },
      {
        $project: {
          ngoName: '$ngo.name',
          ngoEmail: '$ngo.email',
          deliveredCount: 1
        }
      }
    ]);

    res.json({
      message: 'Dashboard statistics retrieved successfully',
      stats: {
        donations: {
          total: totalDonations,
          pending: pendingDonations,
          assigned: assignedDonations,
          delivered: deliveredDonations,
          expired: expiredDonations,
          recent: recentDonations
        },
        users: {
          total: totalUsers,
          ngos: totalNGOs,
          activeNGOs: activeNGOs
        },
        topNGOs
      }
    });

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      message: 'Failed to retrieve dashboard statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Reassign failed donations
 */
const reassignDonations = async (req, res) => {
  try {
    const result = await reassignFailedDonations();
    
    res.json({
      message: 'Reassignment process completed',
      result
    });

  } catch (error) {
    console.error('Reassign donations error:', error);
    res.status(500).json({
      message: 'Failed to reassign donations',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get NGO assignment statistics
 */
const getNGOStats = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verify NGO exists
    const ngo = await User.findById(id);
    if (!ngo || ngo.role !== 'ngo') {
      return res.status(404).json({
        message: 'NGO not found'
      });
    }

    const stats = await getNGOAssignmentStats(id);
    
    res.json({
      message: 'NGO statistics retrieved successfully',
      ngo: {
        id: ngo._id,
        name: ngo.name,
        email: ngo.email
      },
      stats
    });

  } catch (error) {
    console.error('Get NGO stats error:', error);
    res.status(500).json({
      message: 'Failed to retrieve NGO statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Batch assign NGOs to multiple donations
 */
const batchAssign = async (req, res) => {
  try {
    const { donationIds } = req.body;
    
    if (!donationIds || !Array.isArray(donationIds) || donationIds.length === 0) {
      return res.status(400).json({
        message: 'Donation IDs array is required'
      });
    }

    // Get donations
    const donations = await Donation.find({
      _id: { $in: donationIds },
      status: 'pending'
    });

    if (donations.length === 0) {
      return res.status(404).json({
        message: 'No pending donations found with provided IDs'
      });
    }

    const result = await batchAssignNGOs(donations);
    
    res.json({
      message: 'Batch assignment completed',
      result
    });

  } catch (error) {
    console.error('Batch assign error:', error);
    res.status(500).json({
      message: 'Failed to perform batch assignment',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get all donations with filters
 */
const getAllDonations = async (req, res) => {
  try {
    const { 
      status, 
      page = 1, 
      limit = 10, 
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = req.query;

    const query = {};
    if (status) {
      query.status = status;
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const donations = await Donation.find(query)
      .populate('donorId', 'name email role')
      .populate('ngoId', 'name email role')
      .sort(sortOptions)
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
    console.error('Get all donations error:', error);
    res.status(500).json({
      message: 'Failed to retrieve donations',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Update donation status (admin override)
 */
const updateDonationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!status) {
      return res.status(400).json({
        message: 'Status is required'
      });
    }

    const validStatuses = ['pending', 'assigned', 'picked', 'delivered', 'expired', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const donation = await Donation.findById(id);
    if (!donation) {
      return res.status(404).json({
        message: 'Donation not found'
      });
    }

    const updateData = { status };
    
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
      message: 'Donation status updated successfully',
      donation: updatedDonation
    });

  } catch (error) {
    console.error('Update donation status error:', error);
    res.status(500).json({
      message: 'Failed to update donation status',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Compare assignment algorithms
 */
const compareAlgorithms = async (req, res) => {
  try {
    const { lat, lng } = req.body;
    
    if (!lat || !lng) {
      return res.status(400).json({
        message: 'Latitude and longitude are required'
      });
    }

    const result = await compareAssignmentMethods(lat, lng);
    
    res.json({
      message: 'Algorithm comparison completed',
      result
    });

  } catch (error) {
    console.error('Compare algorithms error:', error);
    res.status(500).json({
      message: 'Failed to compare algorithms',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  getDashboardStats,
  reassignDonations,
  getNGOStats,
  batchAssign,
  getAllDonations,
  updateDonationStatus,
  compareAlgorithms
};
