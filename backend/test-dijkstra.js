/**
 * Test script for Dijkstra NGO Assignment Algorithm
 * 
 * This script demonstrates the Dijkstra algorithm implementation
 * for NGO assignment in the AnnaBachao system.
 */

const { 
  findNearestNGO, 
  batchAssignNGOsDijkstra, 
  compareAssignmentAlgorithms 
} = require('./src/utils/dijkstra');

// Sample test data
const testDonorLocation = {
  lat: 28.6139, // New Delhi
  lng: 77.2090
};

const testNGOs = [
  {
    _id: 'ngo1',
    name: 'Food Bank Central',
    lat: 28.6200,
    lng: 77.2200,
    workload: 15,
    capacity: 100
  },
  {
    _id: 'ngo2', 
    name: 'Community Kitchen North',
    lat: 28.6500,
    lng: 77.2500,
    workload: 8,
    capacity: 50
  },
  {
    _id: 'ngo3',
    name: 'Hunger Relief South',
    lat: 28.5800,
    lng: 77.1800,
    workload: 25,
    capacity: 80
  },
  {
    _id: 'ngo4',
    name: 'Food Rescue East',
    lat: 28.6100,
    lng: 77.2800,
    workload: 5,
    capacity: 120
  }
];

const testDonations = [
  {
    _id: 'donation1',
    location: { lat: 28.6139, lng: 77.2090 }
  },
  {
    _id: 'donation2',
    location: { lat: 28.6200, lng: 77.2150 }
  },
  {
    _id: 'donation3',
    location: { lat: 28.6050, lng: 77.1950 }
  }
];

async function testDijkstraAssignment() {
  console.log('🚀 Testing Dijkstra NGO Assignment Algorithm\n');
  
  try {
    // Test 1: Single NGO assignment
    console.log('📍 Test 1: Single NGO Assignment');
    console.log(`Donor Location: ${testDonorLocation.lat}, ${testDonorLocation.lng}`);
    console.log(`Available NGOs: ${testNGOs.length}\n`);
    
    const assignment = await findNearestNGO(
      testDonorLocation.lat,
      testDonorLocation.lng,
      testNGOs,
      {
        maxDistance: 50,
        considerWorkload: true,
        considerCapacity: true
      }
    );
    
    if (assignment) {
      console.log('✅ Assignment Result:');
      console.log(`   NGO: ${assignment.ngo.name}`);
      console.log(`   Distance: ${assignment.distance.toFixed(2)} km`);
      console.log(`   Road Distance: ${assignment.roadDistance.toFixed(2)} km`);
      console.log(`   Score: ${assignment.score.toFixed(2)}`);
      console.log(`   Algorithm: ${assignment.algorithm}`);
      console.log(`   Reason: ${assignment.assignmentReason}\n`);
    } else {
      console.log('❌ No suitable NGO found\n');
    }
    
    // Test 2: Algorithm comparison
    console.log('⚖️  Test 2: Algorithm Comparison');
    const comparison = await compareAssignmentAlgorithms(
      testDonorLocation.lat,
      testDonorLocation.lng,
      testNGOs
    );
    
    if (comparison) {
      console.log('📊 Comparison Results:');
      console.log(`   Closest Distance: ${comparison.closest?.ngo} (${comparison.closest?.distance.toFixed(2)} km)`);
      console.log(`   Dijkstra Optimal: ${comparison.dijkstra?.ngo} (${comparison.dijkstra?.distance.toFixed(2)} km, score: ${comparison.dijkstra?.score.toFixed(2)})`);
      console.log(`   Recommendation: ${comparison.recommendation}\n`);
    }
    
    // Test 3: Batch assignment
    console.log('📦 Test 3: Batch Assignment');
    console.log(`Processing ${testDonations.length} donations...\n`);
    
    const batchResult = await batchAssignNGOsDijkstra(
      testDonations,
      testNGOs,
      {
        maxDistance: 50,
        considerWorkload: true,
        considerCapacity: true
      }
    );
    
    if (batchResult.success) {
      console.log('✅ Batch Assignment Results:');
      console.log(`   Total Donations: ${batchResult.totalDonations}`);
      console.log(`   Successfully Assigned: ${batchResult.totalAssigned}`);
      console.log(`   Algorithm: ${batchResult.algorithm}\n`);
      
      batchResult.assignments.forEach((assignment, index) => {
        console.log(`   Donation ${index + 1}: ${assignment.ngo.name} (${assignment.distance.toFixed(2)} km, score: ${assignment.score.toFixed(2)})`);
      });
    } else {
      console.log('❌ Batch assignment failed:', batchResult.error);
    }
    
    console.log('\n🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testDijkstraAssignment();
}

module.exports = {
  testDijkstraAssignment,
  testDonorLocation,
  testNGOs,
  testDonations
};
