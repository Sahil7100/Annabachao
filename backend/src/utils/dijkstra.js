/**
 * Dijkstra's Algorithm Implementation for NGO Assignment
 * 
 * This module implements Dijkstra's shortest path algorithm to find the nearest NGO
 * for a given donation location, considering road distances and optimal routing.
 */

/**
 * Priority Queue implementation for Dijkstra's algorithm
 */
class PriorityQueue {
  constructor() {
    this.queue = [];
  }

  enqueue(element, priority) {
    const queueElement = { element, priority };
    let added = false;

    for (let i = 0; i < this.queue.length; i++) {
      if (queueElement.priority < this.queue[i].priority) {
        this.queue.splice(i, 0, queueElement);
        added = true;
        break;
      }
    }

    if (!added) {
      this.queue.push(queueElement);
    }
  }

  dequeue() {
    if (this.isEmpty()) {
      return null;
    }
    return this.queue.shift();
  }

  isEmpty() {
    return this.queue.length === 0;
  }

  size() {
    return this.queue.length;
  }
}

/**
 * Calculate Haversine distance between two coordinates
 * @param {number} lat1 - Latitude of first point
 * @param {number} lng1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lng2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
const haversineDistance = (lat1, lng1, lat2, lng2) => {
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
 * Calculate road distance factor (approximation)
 * Road distance is typically 1.2-1.5x the straight-line distance
 * @param {number} straightLineDistance - Straight-line distance in km
 * @returns {number} Estimated road distance in km
 */
const calculateRoadDistance = (straightLineDistance) => {
  // Factor varies by urban density - using 1.3 as average
  return straightLineDistance * 1.3;
};

/**
 * Graph class for representing coordinate network
 */
class CoordinateGraph {
  constructor() {
    this.nodes = new Map(); // nodeId -> { lat, lng, type, data }
    this.edges = new Map(); // nodeId -> [{ targetId, weight }]
  }

  addNode(nodeId, lat, lng, type = 'point', data = {}) {
    this.nodes.set(nodeId, { lat, lng, type, data });
    this.edges.set(nodeId, []);
  }

  addEdge(fromNodeId, toNodeId, weight) {
    if (this.edges.has(fromNodeId)) {
      this.edges.get(fromNodeId).push({ targetId: toNodeId, weight });
    }
  }

  getNode(nodeId) {
    return this.nodes.get(nodeId);
  }

  getNeighbors(nodeId) {
    return this.edges.get(nodeId) || [];
  }

  getAllNodes() {
    return Array.from(this.nodes.keys());
  }

  /**
   * Build a fully connected graph from coordinates
   * @param {Array} coordinates - Array of { id, lat, lng, type, data }
   */
  buildFullyConnected(coordinates) {
    // Add all nodes
    coordinates.forEach(coord => {
      this.addNode(coord.id, coord.lat, coord.lng, coord.type, coord.data);
    });

    // Add edges between all nodes (fully connected)
    const nodeIds = this.getAllNodes();
    for (let i = 0; i < nodeIds.length; i++) {
      for (let j = i + 1; j < nodeIds.length; j++) {
        const node1 = this.getNode(nodeIds[i]);
        const node2 = this.getNode(nodeIds[j]);
        
        const straightDistance = haversineDistance(
          node1.lat, node1.lng, 
          node2.lat, node2.lng
        );
        
        const roadDistance = calculateRoadDistance(straightDistance);
        
        // Add bidirectional edges
        this.addEdge(nodeIds[i], nodeIds[j], roadDistance);
        this.addEdge(nodeIds[j], nodeIds[i], roadDistance);
      }
    }
  }
}

/**
 * Dijkstra's algorithm implementation
 * @param {CoordinateGraph} graph - The coordinate graph
 * @param {string} startNodeId - Starting node ID
 * @param {string} targetType - Type of target nodes to find (e.g., 'ngo')
 * @returns {Object} Shortest paths and distances
 */
const dijkstra = (graph, startNodeId, targetType = null) => {
  const distances = new Map();
  const previous = new Map();
  const visited = new Set();
  const pq = new PriorityQueue();

  // Initialize distances
  graph.getAllNodes().forEach(nodeId => {
    distances.set(nodeId, Infinity);
  });
  distances.set(startNodeId, 0);

  pq.enqueue(startNodeId, 0);

  while (!pq.isEmpty()) {
    const { element: currentNodeId } = pq.dequeue();

    if (visited.has(currentNodeId)) {
      continue;
    }

    visited.add(currentNodeId);

    const neighbors = graph.getNeighbors(currentNodeId);
    
    for (const neighbor of neighbors) {
      const { targetId, weight } = neighbor;
      
      if (visited.has(targetId)) {
        continue;
      }

      const newDistance = distances.get(currentNodeId) + weight;

      if (newDistance < distances.get(targetId)) {
        distances.set(targetId, newDistance);
        previous.set(targetId, currentNodeId);
        pq.enqueue(targetId, newDistance);
      }
    }
  }

  return { distances, previous, visited };
};

/**
 * Find the nearest NGO using Dijkstra's algorithm
 * @param {number} donorLat - Donor's latitude
 * @param {number} donorLng - Donor's longitude
 * @param {Array} ngos - Array of NGO objects with { _id, lat, lng, name, data }
 * @param {Object} options - Configuration options
 * @returns {Object|null} Nearest NGO with distance and path information
 */
const findNearestNGO = async (donorLat, donorLng, ngos, options = {}) => {
  try {
    const {
      maxDistance = 50, // Maximum search radius in km
      considerWorkload = true,
      considerCapacity = true,
      roadNetwork = false // Future enhancement for actual road networks
    } = options;

    if (!ngos || ngos.length === 0) {
      console.log('No NGOs provided for assignment');
      return null;
    }

    // Create coordinate list for graph
    const coordinates = [
      {
        id: 'donor',
        lat: donorLat,
        lng: donorLng,
        type: 'donor',
        data: { isDonor: true }
      },
      ...ngos.map(ngo => ({
        id: ngo._id.toString(),
        lat: ngo.lat,
        lng: ngo.lng,
        type: 'ngo',
        data: { 
          ngoId: ngo._id,
          name: ngo.name,
          workload: ngo.workload || 0,
          capacity: ngo.capacity || 100,
          isActive: ngo.isActive !== false
        }
      }))
    ];

    // Filter NGOs within reasonable distance first
    const nearbyNGOs = ngos.filter(ngo => {
      const distance = haversineDistance(donorLat, donorLng, ngo.lat, ngo.lng);
      return distance <= maxDistance && ngo.isActive !== false;
    });

    if (nearbyNGOs.length === 0) {
      console.log(`No NGOs found within ${maxDistance}km radius`);
      return null;
    }

    // If only one NGO nearby, return it directly
    if (nearbyNGOs.length === 1) {
      const ngo = nearbyNGOs[0];
      const distance = haversineDistance(donorLat, donorLng, ngo.lat, ngo.lng);
      return {
        ngo: ngo,
        distance: distance,
        roadDistance: calculateRoadDistance(distance),
        assignmentReason: 'only_nearby_ngo',
        algorithm: 'haversine'
      };
    }

    // Build graph with nearby NGOs
    const nearbyCoordinates = [
      {
        id: 'donor',
        lat: donorLat,
        lng: donorLng,
        type: 'donor',
        data: { isDonor: true }
      },
      ...nearbyNGOs.map(ngo => ({
        id: ngo._id.toString(),
        lat: ngo.lat,
        lng: ngo.lng,
        type: 'ngo',
        data: { 
          ngoId: ngo._id,
          name: ngo.name,
          workload: ngo.workload || 0,
          capacity: ngo.capacity || 100
        }
      }))
    ];

    const graph = new CoordinateGraph();
    graph.buildFullyConnected(nearbyCoordinates);

    // Run Dijkstra's algorithm
    const { distances, previous } = dijkstra(graph, 'donor');

    // Find the best NGO based on distance and other factors
    let bestNGO = null;
    let bestScore = Infinity;

    for (const ngo of nearbyNGOs) {
      const ngoId = ngo._id.toString();
      const distance = distances.get(ngoId);

      if (distance === Infinity) {
        continue; // Unreachable
      }

      // Calculate assignment score
      let score = distance;

      // Adjust score based on workload (higher workload = higher score)
      if (considerWorkload && ngo.workload) {
        const workloadFactor = ngo.workload / (ngo.capacity || 100);
        score += (workloadFactor * 10); // Add up to 10km penalty for high workload
      }

      // Adjust score based on capacity (lower capacity = higher score)
      if (considerCapacity && ngo.capacity) {
        const capacityFactor = 1 - (ngo.capacity / 100);
        score += (capacityFactor * 5); // Add up to 5km penalty for low capacity
      }

      if (score < bestScore) {
        bestScore = score;
        bestNGO = {
          ngo: ngo,
          distance: distance,
          roadDistance: calculateRoadDistance(distance),
          score: score,
          assignmentReason: 'dijkstra_optimal',
          algorithm: 'dijkstra'
        };
      }
    }

    if (!bestNGO) {
      console.log('No suitable NGO found using Dijkstra algorithm');
      return null;
    }

    console.log(`Dijkstra assignment: ${bestNGO.ngo.name} (${bestNGO.distance.toFixed(2)}km, score: ${bestNGO.score.toFixed(2)})`);
    return bestNGO;

  } catch (error) {
    console.error('Error in findNearestNGO:', error);
    return null;
  }
};

/**
 * Batch assignment for multiple donations using Dijkstra
 * @param {Array} donations - Array of donation objects with location data
 * @param {Array} ngos - Array of available NGOs
 * @param {Object} options - Configuration options
 * @returns {Object} Batch assignment results
 */
const batchAssignNGOsDijkstra = async (donations, ngos, options = {}) => {
  try {
    const assignments = [];
    const ngoWorkloads = new Map();

    // Initialize NGO workloads
    ngos.forEach(ngo => {
      ngoWorkloads.set(ngo._id.toString(), ngo.workload || 0);
    });

    // Process each donation
    for (const donation of donations) {
      if (!donation.location || !donation.location.lat || !donation.location.lng) {
        console.log(`Donation ${donation._id} missing location data`);
        continue;
      }

      // Update NGO workloads for consideration
      const ngosWithUpdatedWorkloads = ngos.map(ngo => ({
        ...ngo,
        workload: ngoWorkloads.get(ngo._id.toString())
      }));

      const assignment = await findNearestNGO(
        donation.location.lat,
        donation.location.lng,
        ngosWithUpdatedWorkloads,
        options
      );

      if (assignment) {
        assignments.push({
          donationId: donation._id,
          ngo: assignment.ngo,
          distance: assignment.distance,
          roadDistance: assignment.roadDistance,
          score: assignment.score,
          algorithm: assignment.algorithm
        });

        // Update workload for the assigned NGO
        const currentWorkload = ngoWorkloads.get(assignment.ngo._id.toString());
        ngoWorkloads.set(assignment.ngo._id.toString(), currentWorkload + 1);
      }
    }

    return {
      success: true,
      assignments,
      totalAssigned: assignments.length,
      totalDonations: donations.length,
      algorithm: 'dijkstra_batch'
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
 * Compare assignment algorithms
 * @param {number} donorLat - Donor's latitude
 * @param {number} donorLng - Donor's longitude
 * @param {Array} ngos - Array of NGOs
 * @returns {Object} Comparison results
 */
const compareAssignmentAlgorithms = async (donorLat, donorLng, ngos) => {
  try {
    // Simple closest distance assignment
    const closestNGO = ngos.reduce((closest, ngo) => {
      const distance = haversineDistance(donorLat, donorLng, ngo.lat, ngo.lng);
      if (!closest || distance < closest.distance) {
        return { ngo, distance };
      }
      return closest;
    }, null);

    // Dijkstra assignment
    const dijkstraAssignment = await findNearestNGO(donorLat, donorLng, ngos);

    return {
      closest: closestNGO ? {
        ngo: closestNGO.ngo.name,
        distance: closestNGO.distance,
        algorithm: 'closest'
      } : null,
      dijkstra: dijkstraAssignment ? {
        ngo: dijkstraAssignment.ngo.name,
        distance: dijkstraAssignment.distance,
        score: dijkstraAssignment.score,
        algorithm: 'dijkstra'
      } : null,
      recommendation: dijkstraAssignment ? 'dijkstra' : 'closest'
    };

  } catch (error) {
    console.error('Error comparing algorithms:', error);
    return null;
  }
};

module.exports = {
  PriorityQueue,
  CoordinateGraph,
  haversineDistance,
  calculateRoadDistance,
  dijkstra,
  findNearestNGO,
  batchAssignNGOsDijkstra,
  compareAssignmentAlgorithms
};
