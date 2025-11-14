const User = require('../models/User');
const { findNearestNGO, batchAssignNGOsDijkstra, compareAssignmentAlgorithms } = require('./dijkstra');

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lng1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lng2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

/**
 * Find nearby NGOs within specified radius
 * @param {number} lat - Latitude of donation location
 * @param {number} lng - Longitude of donation location
 * @param {number} maxDistance - Maximum distance in kilometers (default: 20)
 * @returns {Array} Array of nearby NGOs with distance
 */
const findNearbyNGOs = async (lat, lng, maxDistance = 20) => {
  try {
    // Find all active NGOs with location data
    const ngos = await User.find({
      role: 'ngo',
      isActive: true,
      'profile.lat': { $exists: true },
      'profile.lng': { $exists: true }
    }).select('name email profile');

    const nearbyNGOs = [];

    for (const ngo of ngos) {
      if (ngo.profile.lat && ngo.profile.lng) {
        const distance = calculateDistance(lat, lng, ngo.profile.lat, ngo.profile.lng);
        
        if (distance <= maxDistance) {
          nearbyNGOs.push({
            ngo: ngo,
            distance: distance,
            coordinates: {
              lat: ngo.profile.lat,
              lng: ngo.profile.lng
            }
          });
        }
      }
    }

    // Sort by distance (closest first)
    return nearbyNGOs.sort((a, b) => a.distance - b.distance);

  } catch (error) {
    console.error('Error finding nearby NGOs:', error);
    return [];
  }
};

/**
 * Optimal NGO assignment using Dijkstra algorithm
 * @param {Object} donation - Donation object
 * @returns {Object|null} Assigned NGO or null
 */
const assignOptimalNGO = async (donation) => {
  try {
    const { location } = donation;
    
    if (!location || !location.lat || !location.lng) {
      console.log('Donation missing location data');
      return null;
    }

    // Find all active NGOs with location data
    const ngos = await User.find({
      role: 'ngo',
      isActive: true,
      'profile.lat': { $exists: true },
      'profile.lng': { $exists: true }
    }).select('name email profile');

    if (ngos.length === 0) {
      console.log('No active NGOs found with location data');
      return null;
    }

    // Transform NGOs to the format expected by Dijkstra algorithm
    const ngosWithCoords = ngos.map(ngo => ({
      _id: ngo._id,
      name: ngo.name,
      lat: ngo.profile.lat,
      lng: ngo.profile.lng,
      workload: ngo.profile.workload || 0,
      capacity: ngo.profile.capacity || 100,
      isActive: ngo.isActive
    }));

    // Use Dijkstra algorithm to find optimal NGO
    const assignment = await findNearestNGO(
      location.lat,
      location.lng,
      ngosWithCoords,
      {
        maxDistance: 50, // 50km search radius
        considerWorkload: true,
        considerCapacity: true
      }
    );

    if (assignment) {
      console.log(`Dijkstra assigned donation ${donation._id} to NGO ${assignment.ngo.name} (${assignment.distance.toFixed(2)}km, score: ${assignment.score.toFixed(2)})`);
      return {
        ngo: assignment.ngo,
        distance: assignment.distance,
        roadDistance: assignment.roadDistance,
        score: assignment.score,
        assignmentReason: assignment.assignmentReason,
        algorithm: 'dijkstra'
      };
    }

    // Fallback to simple closest distance if Dijkstra fails
    console.log('Dijkstra assignment failed, falling back to closest distance');
    const nearbyNGOs = await findNearbyNGOs(location.lat, location.lng, 20);
    
    if (nearbyNGOs.length > 0) {
      const assignedNGO = nearbyNGOs[0];
      console.log(`Fallback assigned donation ${donation._id} to NGO ${assignedNGO.ngo.name} (${assignedNGO.distance.toFixed(2)}km away)`);
      
      return {
        ngo: assignedNGO.ngo,
        distance: assignedNGO.distance,
        assignmentReason: 'fallback_closest',
        algorithm: 'haversine'
      };
    }

    console.log('No suitable NGOs found for assignment');
    return null;

  } catch (error) {
    console.error('Error assigning NGO:', error);
    return null;
  }
};

/**
 * Batch assignment for multiple donations using Dijkstra algorithm
 * @param {Array} donations - Array of donation objects
 * @returns {Object} Assignment results
 */
const batchAssignNGOs = async (donations) => {
  try {
    // Find all active NGOs with location data
    const ngos = await User.find({
      role: 'ngo',
      isActive: true,
      'profile.lat': { $exists: true },
      'profile.lng': { $exists: true }
    }).select('name email profile');

    if (ngos.length === 0) {
      return {
        success: false,
        error: 'No active NGOs found with location data',
        assignments: []
      };
    }

    // Transform NGOs to the format expected by Dijkstra algorithm
    const ngosWithCoords = ngos.map(ngo => ({
      _id: ngo._id,
      name: ngo.name,
      lat: ngo.profile.lat,
      lng: ngo.profile.lng,
      workload: ngo.profile.workload || 0,
      capacity: ngo.profile.capacity || 100,
      isActive: ngo.isActive
    }));

    // Use Dijkstra batch assignment
    const result = await batchAssignNGOsDijkstra(donations, ngosWithCoords, {
      maxDistance: 50,
      considerWorkload: true,
      considerCapacity: true
    });

    return {
      success: result.success,
      assignments: result.assignments,
      totalAssigned: result.totalAssigned,
      totalDonations: result.totalDonations,
      algorithm: result.algorithm || 'dijkstra_batch'
    };

  } catch (error) {
    console.error('Error in batch assignment:', error);
    return {
      success: false,
      error: error.message,
      assignments: []
    };
  }
};

/**
 * Get assignment statistics for an NGO
 * @param {string} ngoId - NGO user ID
 * @returns {Object} Assignment statistics
 */
const getNGOAssignmentStats = async (ngoId) => {
  try {
    const Donation = require('../models/Donation');
    
    const stats = await Donation.aggregate([
      { $match: { ngoId: require('mongoose').Types.ObjectId(ngoId) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgDistance: { $avg: '$distance' } // If we store distance
        }
      }
    ]);

    const totalAssignments = await Donation.countDocuments({ ngoId });
    const pendingAssignments = await Donation.countDocuments({ 
      ngoId, 
      status: { $in: ['assigned', 'pending'] } 
    });

    return {
      totalAssignments,
      pendingAssignments,
      statusBreakdown: stats,
      efficiency: totalAssignments > 0 ? ((totalAssignments - pendingAssignments) / totalAssignments * 100).toFixed(2) : 0
    };

  } catch (error) {
    console.error('Error getting NGO assignment stats:', error);
    return {
      totalAssignments: 0,
      pendingAssignments: 0,
      statusBreakdown: [],
      efficiency: 0
    };
  }
};

/**
 * Reassign expired or failed donations
 * @returns {Object} Reassignment results
 */
const reassignFailedDonations = async () => {
  try {
    const Donation = require('../models/Donation');
    
    // Find donations that need reassignment
    const failedDonations = await Donation.find({
      $or: [
        { status: 'expired' },
        { 
          status: 'assigned',
          assignedAt: { $lt: new Date(Date.now() - 2 * 60 * 60 * 1000) } // Assigned more than 2 hours ago
        }
      ]
    });

    if (failedDonations.length === 0) {
      return { message: 'No donations need reassignment', reassigned: 0 };
    }

    let reassigned = 0;
    const results = [];

    for (const donation of failedDonations) {
      // Reset status and try reassignment
      donation.status = 'pending';
      donation.ngoId = null;
      donation.assignedAt = null;

      const assignment = await assignOptimalNGO(donation);
      
      if (assignment) {
        donation.ngoId = assignment.ngo._id;
        donation.status = 'assigned';
        donation.assignedAt = new Date();
        await donation.save();
        reassigned++;
        
        results.push({
          donationId: donation._id,
          newNGO: assignment.ngo.name,
          distance: assignment.distance
        });
      } else {
        // If no NGO available, mark as expired
        donation.status = 'expired';
        await donation.save();
      }
    }

    return {
      message: `Reassigned ${reassigned} out of ${failedDonations.length} donations`,
      reassigned,
      results
    };

  } catch (error) {
    console.error('Error reassigning failed donations:', error);
    return {
      message: 'Failed to reassign donations',
      error: error.message,
      reassigned: 0
    };
  }
};

/**
 * Compare assignment algorithms for a donation
 * @param {number} lat - Donation latitude
 * @param {number} lng - Donation longitude
 * @returns {Object} Comparison results
 */
const compareAssignmentMethods = async (lat, lng) => {
  try {
    const ngos = await User.find({
      role: 'ngo',
      isActive: true,
      'profile.lat': { $exists: true },
      'profile.lng': { $exists: true }
    }).select('name email profile');

    if (ngos.length === 0) {
      return {
        error: 'No active NGOs found with location data'
      };
    }

    const ngosWithCoords = ngos.map(ngo => ({
      _id: ngo._id,
      name: ngo.name,
      lat: ngo.profile.lat,
      lng: ngo.profile.lng,
      workload: ngo.profile.workload || 0,
      capacity: ngo.profile.capacity || 100
    }));

    const comparison = await compareAssignmentAlgorithms(lat, lng, ngosWithCoords);
    
    return {
      success: true,
      comparison,
      totalNGOs: ngos.length
    };

  } catch (error) {
    console.error('Error comparing assignment methods:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  calculateDistance,
  findNearbyNGOs,
  assignOptimalNGO,
  batchAssignNGOs,
  getNGOAssignmentStats,
  reassignFailedDonations,
  compareAssignmentMethods
};
