import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { donationAPI, adminAPI } from '../../services/api';

const DashboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const isFocused = useIsFocused();
  const [stats, setStats] = useState(null);
  const [recentDonations, setRecentDonations] = useState([]);
  const [activity, setActivity] = useState({ total: 0, delivered: 0, pending: 0, assigned: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (isFocused) {
      loadDashboardData();
    }
  }, [isFocused]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      if (user.role === 'admin') {
        const response = await adminAPI.getDashboardStats();
        setStats(response.data.stats);
      } else {
        // Load user-specific data
        const response = await donationAPI.getUserDonations(user.id || user._id, { limit: 50 });
        const donations = response.data.donations || [];
        setRecentDonations(donations.slice(0, 5));
        const totals = donations.reduce((acc, d) => {
          acc.total += 1;
          acc[d.status] = (acc[d.status] || 0) + 1;
          return acc;
        }, { total: 0, pending: 0, assigned: 0, picked: 0, delivered: 0, cancelled: 0, expired: 0 });
        setActivity({ total: totals.total, delivered: totals.delivered, pending: totals.pending, assigned: totals.assigned });
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const renderAdminDashboard = () => (
    <View style={styles.statsContainer}>
      <Text style={styles.sectionTitle}>System Overview</Text>
      
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats?.donations?.total || 0}</Text>
          <Text style={styles.statLabel}>Total Donations</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats?.donations?.pending || 0}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats?.donations?.delivered || 0}</Text>
          <Text style={styles.statLabel}>Delivered</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats?.users?.total || 0}</Text>
          <Text style={styles.statLabel}>Users</Text>
        </View>
      </View>

      {stats?.topNGOs && stats.topNGOs.length > 0 && (
        <View style={styles.ngosSection}>
          <Text style={styles.sectionTitle}>Top Performing NGOs</Text>
          {stats.topNGOs.map((ngo, index) => (
            <View key={index} style={styles.ngoItem}>
              <Text style={styles.ngoName}>{ngo.ngoName}</Text>
              <Text style={styles.ngoStats}>{ngo.deliveredCount} deliveries</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const renderUserDashboard = () => (
    <View style={styles.userContainer}>
      <View style={styles.welcomeCard}>
        <Text style={styles.welcomeText}>Welcome back, {user.name}!</Text>
        <Text style={styles.roleText}>Role: {user.role.toUpperCase()}</Text>
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Donate')}>
          <Text style={styles.actionButtonText}>🍽️ Donate Food</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('MapView')}>
          <Text style={styles.actionButtonText}>📍 View Map</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('NGOList')}>
          <Text style={styles.actionButtonText}>👥 Browse NGOs</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.activityCard}>
        <Text style={styles.sectionTitle}>Your Activity</Text>
        <View style={styles.statsRow}>
          <View style={styles.activityItem}><Text style={styles.activityNumber}>{activity.total}</Text><Text style={styles.activityLabel}>Donations</Text></View>
          <View style={styles.activityItem}><Text style={styles.activityNumber}>{activity.assigned}</Text><Text style={styles.activityLabel}>Assigned</Text></View>
          <View style={styles.activityItem}><Text style={styles.activityNumber}>{activity.pending}</Text><Text style={styles.activityLabel}>Pending</Text></View>
          <View style={styles.activityItem}><Text style={styles.activityNumber}>{activity.delivered}</Text><Text style={styles.activityLabel}>Meals Provided</Text></View>
        </View>
      </View>

      {recentDonations.length > 0 && (
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Recent Donations</Text>
          {recentDonations.map((donation, index) => (
            <View key={index} style={styles.donationItem}>
              <Text style={styles.donationFood}>{donation.foodItem}</Text>
              <Text style={styles.donationStatus}>Status: {donation.status}</Text>
              <Text style={styles.donationDate}>
                {new Date(donation.createdAt).toLocaleDateString()}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <Text style={styles.headerSubtitle}>
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : user.role === 'admin' ? (
        renderAdminDashboard()
      ) : (
        renderUserDashboard()
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#22c55e',
    padding: 20,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  statsContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#22c55e',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  ngosSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ngoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  ngoName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  ngoStats: {
    fontSize: 12,
    color: '#6b7280',
  },
  userContainer: {
    padding: 20,
  },
  welcomeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
  },
  roleText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  quickActions: {
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionButtonText: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
  },
  recentSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activityCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  activityItem: {
    alignItems: 'center',
    flex: 1,
  },
  activityNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#22c55e',
  },
  activityLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
  },
  donationItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  donationFood: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  donationStatus: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  donationDate: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
});

export default DashboardScreen;
