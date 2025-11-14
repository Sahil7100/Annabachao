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
import { useAuth } from '../../context/AuthContext';
import { donationAPI } from '../../services/api';

const NGODashboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalAssigned: 0,
    pending: 0,
    picked: 0,
    delivered: 0,
  });
  const [recentDonations, setRecentDonations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const ngoId = user?.id || user?._id;
      const donationsResponse = await donationAPI.getNGODonations(ngoId);
      const list = donationsResponse.data.donations || [];

      // Compute basic stats on the client to avoid admin-only endpoint
      const computed = {
        totalAssigned: list.length,
        pending: list.filter(d => d.status === 'assigned').length,
        picked: list.filter(d => d.status === 'picked').length,
        delivered: list.filter(d => d.status === 'delivered').length,
      };

      setStats(computed);
      setRecentDonations(list.slice(0, 5));
    } catch (error) {
      console.error('Error loading NGO dashboard:', error);
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

  const StatCard = ({ title, value, color, icon }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statContent}>
        <Text style={styles.statIcon}>{icon}</Text>
        <View>
          <Text style={styles.statValue}>{value}</Text>
          <Text style={styles.statTitle}>{title}</Text>
        </View>
      </View>
    </View>
  );

  const QuickAction = ({ title, description, icon, onPress, color = '#22c55e' }) => (
    <TouchableOpacity style={styles.quickAction} onPress={onPress}>
      <View style={[styles.quickActionIcon, { backgroundColor: color }]}>
        <Text style={styles.quickActionIconText}>{icon}</Text>
      </View>
      <View style={styles.quickActionContent}>
        <Text style={styles.quickActionTitle}>{title}</Text>
        <Text style={styles.quickActionDescription}>{description}</Text>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome back,</Text>
        <Text style={styles.nameText}>{user.name}</Text>
        <Text style={styles.roleText}>NGO Partner</Text>
      </View>

      {/* Statistics Cards */}
      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>Your Statistics</Text>
        <View style={styles.statsGrid}>
          <StatCard
            title="Total Assigned"
            value={stats.totalAssigned}
            color="#3b82f6"
            icon="📦"
          />
          <StatCard
            title="Pending Pickup"
            value={stats.pending}
            color="#f59e0b"
            icon="⏳"
          />
          <StatCard
            title="Picked Up"
            value={stats.picked}
            color="#22c55e"
            icon="✅"
          />
          <StatCard
            title="Delivered"
            value={stats.delivered}
            color="#10b981"
            icon="🎯"
          />
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsContainer}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <QuickAction
          title="View Available Donations"
          description="See all nearby food donations"
          icon="🍽️"
          onPress={() => navigation.navigate('Available')}
          color="#22c55e"
        />
        <QuickAction
          title="My Assigned Donations"
          description="Manage your assigned donations"
          icon="📋"
          onPress={() => navigation.navigate('MyDonations')}
          color="#3b82f6"
        />
        <QuickAction
          title="Upload Proof"
          description="Upload delivery proof images"
          icon="📸"
          onPress={() => navigation.navigate('ProofUpload')}
          color="#8b5cf6"
        />
      </View>

      {/* Recent Donations */}
      {recentDonations.length > 0 && (
        <View style={styles.recentContainer}>
          <View style={styles.recentHeader}>
            <Text style={styles.sectionTitle}>Recent Donations</Text>
            <TouchableOpacity onPress={() => navigation.navigate('MyDonations')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          {recentDonations.map((donation) => (
            <View key={donation._id} style={styles.recentDonation}>
              <View style={styles.recentDonationContent}>
                <Text style={styles.recentDonationTitle}>{donation.foodItem}</Text>
                <Text style={styles.recentDonationDetails}>
                  {donation.quantity} {donation.quantityUnit}
                </Text>
                <Text style={styles.recentDonationStatus}>
                  Status: {donation.status}
                </Text>
              </View>
              <View style={styles.recentDonationActions}>
                <TouchableOpacity
                  style={styles.statusButton}
                  onPress={() =>
                    navigation.navigate('DonationDetails', { donation })
                  }
                >
                  <Text style={styles.statusButtonText}>View</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Performance Tips */}
      <View style={styles.tipsContainer}>
        <Text style={styles.sectionTitle}>Performance Tips</Text>
        <View style={styles.tipCard}>
          <Text style={styles.tipText}>
            💡 Quick pickup helps reduce food waste and ensures freshness
          </Text>
        </View>
        <View style={styles.tipCard}>
          <Text style={styles.tipText}>
            📸 Always upload proof images for transparency and tracking
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    backgroundColor: '#22c55e',
    padding: 24,
    paddingTop: 60,
  },
  welcomeText: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.9,
  },
  nameText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 4,
  },
  roleText: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.8,
    marginTop: 2,
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
  },
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
  },
  statTitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  quickActionsContainer: {
    padding: 20,
    paddingTop: 0,
  },
  quickAction: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  quickActionIconText: {
    fontSize: 20,
    color: '#ffffff',
  },
  quickActionContent: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  quickActionDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  recentContainer: {
    padding: 20,
    paddingTop: 0,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    color: '#22c55e',
    fontWeight: '600',
  },
  recentDonation: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recentDonationContent: {
    flex: 1,
  },
  recentDonationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  recentDonationDetails: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  recentDonationStatus: {
    fontSize: 12,
    color: '#22c55e',
    fontWeight: '500',
  },
  recentDonationActions: {
    marginLeft: 12,
  },
  statusButton: {
    backgroundColor: '#22c55e',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  tipsContainer: {
    padding: 20,
    paddingTop: 0,
    paddingBottom: 40,
  },
  tipCard: {
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#3b82f6',
  },
  tipText: {
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
  },
});

export default NGODashboardScreen;

