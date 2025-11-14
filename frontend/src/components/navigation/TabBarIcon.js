import React from 'react';
import { Ionicons } from '@expo/vector-icons';

const TabBarIcon = ({ route, focused, color, size }) => {
  let iconName;

  switch (route.name) {
    // Common icons
    case 'Dashboard':
      iconName = focused ? 'home' : 'home-outline';
      break;
    case 'Profile':
      iconName = focused ? 'person' : 'person-outline';
      break;
    
    // User-specific icons
    case 'Donate':
      iconName = focused ? 'restaurant' : 'restaurant-outline';
      break;
    case 'MapView':
      iconName = focused ? 'map' : 'map-outline';
      break;
    case 'NGOList':
      iconName = focused ? 'people' : 'people-outline';
      break;
    
    // NGO-specific icons
    case 'Available':
      iconName = focused ? 'list' : 'list-outline';
      break;
    case 'MyDonations':
      iconName = focused ? 'clipboard' : 'clipboard-outline';
      break;
    case 'ProofUpload':
      iconName = focused ? 'camera' : 'camera-outline';
      break;
    
    // Admin-specific icons
    case 'Users':
      iconName = focused ? 'people' : 'people-outline';
      break;
    case 'WebDashboard':
      iconName = focused ? 'globe' : 'globe-outline';
      break;
    
    default:
      iconName = 'help-outline';
  }

  return <Ionicons name={iconName} size={size} color={color} />;
};

export default TabBarIcon;
