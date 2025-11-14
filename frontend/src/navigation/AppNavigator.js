import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';

// Import screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import DashboardScreen from '../screens/main/DashboardScreen';
import DonateScreen from '../screens/main/DonateScreen';
import DonationSuccessScreen from '../screens/main/DonationSuccessScreen';
import NGOListScreen from '../screens/main/NGOListScreen';
import MapViewScreen from '../screens/main/MapViewScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import LoadingScreen from '../screens/common/LoadingScreen';

// NGO Screens
import NGODashboardScreen from '../screens/ngo/NGODashboardScreen';
import AvailableDonationsScreen from '../screens/ngo/AvailableDonationsScreen';
import MyDonationsScreen from '../screens/ngo/MyDonationsScreen';
import ProofUploadScreen from '../screens/ngo/ProofUploadScreen';

// Admin Screens
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import UserManagementScreen from '../screens/admin/UserManagementScreen';
import WebViewDashboardScreen from '../screens/admin/WebViewDashboardScreen';

// Import components
import TabBarIcon from '../components/navigation/TabBarIcon';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// User Tab Navigator for regular users
const UserTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => (
          <TabBarIcon route={route} focused={focused} color={color} size={size} />
        ),
        tabBarActiveTintColor: '#22c55e',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          paddingBottom: 10,
          paddingTop: 5,
          height: 70,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen
        name="Donate"
        component={DonateScreen}
        options={{ title: 'Donate' }}
      />
      <Tab.Screen
        name="MapView"
        component={MapViewScreen}
        options={{ title: 'Map' }}
      />
      <Tab.Screen
        name="NGOList"
        component={NGOListScreen}
        options={{ title: 'NGOs' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

// NGO Tab Navigator for NGO users
const NGOTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => (
          <TabBarIcon route={route} focused={focused} color={color} size={size} />
        ),
        tabBarActiveTintColor: '#22c55e',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={NGODashboardScreen}
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen
        name="Available"
        component={AvailableDonationsScreen}
        options={{ title: 'Available' }}
      />
      <Tab.Screen
        name="MyDonations"
        component={MyDonationsScreen}
        options={{ title: 'My Donations' }}
      />
      <Tab.Screen
        name="ProofUpload"
        component={ProofUploadScreen}
        options={{ title: 'Proof Upload' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

// Admin Tab Navigator for admin users
const AdminTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => (
          <TabBarIcon route={route} focused={focused} color={color} size={size} />
        ),
        tabBarActiveTintColor: '#ef4444',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={AdminDashboardScreen}
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen
        name="Users"
        component={UserManagementScreen}
        options={{ title: 'Users' }}
      />
      <Tab.Screen
        name="WebDashboard"
        component={WebViewDashboardScreen}
        options={{ title: 'Web View' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

// Auth stack navigator for unauthenticated users
const AuthStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#ffffff' },
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
};

// Main app navigator
const AppNavigator = () => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  // Select the appropriate tab navigator based on user role
  const getTabNavigator = () => {
    if (!user) return UserTabNavigator;
    
    switch (user.role) {
      case 'ngo':
        return NGOTabNavigator;
      case 'admin':
        return AdminTabNavigator;
      default:
        return UserTabNavigator;
    }
  };

  const TabNavigator = getTabNavigator();

  return (
    <NavigationContainer>
      {isAuthenticated ? (
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="MainTabs" component={TabNavigator} />
          <Stack.Screen 
            name="DonationSuccess" 
            component={DonationSuccessScreen}
            options={{
              headerShown: false,
              presentation: 'modal',
            }}
          />
        </Stack.Navigator>
      ) : (
        <AuthStackNavigator />
      )}
    </NavigationContainer>
  );
};

export default AppNavigator;
