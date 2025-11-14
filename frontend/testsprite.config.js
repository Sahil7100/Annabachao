// TestSprite Configuration for AnnaBachao React Native App
module.exports = {
  // Project Information
  projectName: 'AnnaBachao Frontend',
  projectType: 'react-native',
  version: '1.0.0',
  
  // Test Configuration
  testConfig: {
    // App Entry Points
    entryPoints: [
      './App.js',
      './src/navigation/AppNavigator.js',
      './src/context/AuthContext.js'
    ],
    
    // Screen Components to Test
    screens: [
      './src/screens/auth/LoginScreen.js',
      './src/screens/auth/RegisterScreen.js',
      './src/screens/main/DashboardScreen.js',
      './src/screens/main/DonateScreen.js',
      './src/screens/main/NGOListScreen.js',
      './src/screens/main/MapViewScreen.js',
      './src/screens/main/ProfileScreen.js',
      './src/screens/ngo/NGODashboardScreen.js',
      './src/screens/ngo/AvailableDonationsScreen.js',
      './src/screens/admin/AdminDashboardScreen.js'
    ],
    
    // API Endpoints to Test
    apiEndpoints: [
      'http://localhost:3000/api/auth/login',
      'http://localhost:3000/api/auth/register',
      'http://localhost:3000/api/donations',
      'http://localhost:3000/api/admin/users'
    ],
    
    // Test Scenarios
    testScenarios: [
      {
        name: 'User Authentication Flow',
        description: 'Test login and registration functionality',
        steps: [
          'Navigate to login screen',
          'Enter valid credentials',
          'Verify successful login',
          'Test logout functionality'
        ]
      },
      {
        name: 'Donation Flow',
        description: 'Test donation creation and management',
        steps: [
          'Navigate to donate screen',
          'Fill donation form',
          'Submit donation',
          'Verify donation success screen'
        ]
      },
      {
        name: 'NGO Dashboard',
        description: 'Test NGO-specific functionality',
        steps: [
          'Login as NGO user',
          'Access NGO dashboard',
          'View available donations',
          'Manage donations'
        ]
      },
      {
        name: 'Admin Panel',
        description: 'Test admin functionality',
        steps: [
          'Login as admin user',
          'Access admin dashboard',
          'Manage users',
          'View system statistics'
        ]
      }
    ],
    
    // User Roles for Testing
    userRoles: [
      {
        role: 'regular_user',
        credentials: {
          email: 'testuser@example.com',
          password: 'testpassword123'
        }
      },
      {
        role: 'ngo_user',
        credentials: {
          email: 'testngo@example.com',
          password: 'testpassword123'
        }
      },
      {
        role: 'admin_user',
        credentials: {
          email: 'admin@example.com',
          password: 'adminpassword123'
        }
      }
    ],
    
    // Test Environment
    environment: {
      platform: 'expo',
      device: 'simulator',
      os: 'ios/android',
      network: 'wifi'
    },
    
    // Test Data
    testData: {
      donations: [
        {
          type: 'food',
          quantity: 5,
          description: 'Fresh vegetables',
          location: 'Test Location',
          expiryDate: '2024-12-31'
        }
      ],
      users: [
        {
          name: 'Test User',
          email: 'testuser@example.com',
          phone: '+1234567890',
          role: 'user'
        }
      ]
    }
  },
  
  // Reporting Configuration
  reporting: {
    outputDir: './test-results',
    formats: ['json', 'html', 'junit'],
    includeScreenshots: true,
    includeVideos: false
  },
  
  // Performance Testing
  performance: {
    enabled: true,
    thresholds: {
      loadTime: 3000, // 3 seconds
      memoryUsage: 100, // 100MB
      cpuUsage: 80 // 80%
    }
  },
  
  // Accessibility Testing
  accessibility: {
    enabled: true,
    standards: ['WCAG 2.1 AA'],
    tools: ['axe-core', 'react-native-accessibility']
  }
};
