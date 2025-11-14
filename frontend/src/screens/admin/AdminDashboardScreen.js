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
import { adminAPI } from '../../services/api';

const AdminDashboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [dashboardStats, setDashboardStats] = useState({
    totalDonations: 0,
    pendingDonations: 0,
    completedDonations: 0,
    totalUsers: 0,
    totalNGOs: 0,
    totalAdmins: 0,
    avgResponseTime: 0,
    successRate: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const response = await adminAPI.getDashboardStats();
      setDashboardStats(response.data.stats);
      setRecentActivity(response.data.recentActivity || []);
    } catch (error) {
      console.error('Error loading admin dashboard:', error);
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

  const StatCard = ({ title, value, subtitle, color, icon, onPress }) => (
    <TouchableOpacity
      style={[styles.statCard, { borderLeftColor: color }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.statContent}>
        <Text style={styles.statIcon}>{icon}</Text>
        <View style={styles.statTextContainer}>
          <Text style={styles.statValue}>{value}</Text>
          <Text style={styles.statTitle}>{title}</Text>
          {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
        </View>
      </View>
    </TouchableOpacity>
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

  const ActivityItem = ({ activity }) => (
    <View style={styles.activityItem}>
      <Text style={styles.activityIcon}>{activity.icon}</Text>
      <View style={styles.activityContent}>
        <Text style={styles.activityText}>{activity.description}</Text>
        <Text style={styles.activityTime}>{activity.time}</Text>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading admin dashboard...</Text>
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
        <Text style={styles.roleText}>System Administrator</Text>
      </View>

      {/* Overview Statistics */}
      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>System Overview</Text>
        <View style={styles.statsGrid}>
          <StatCard
            title="Total Donations"
            value={dashboardStats.totalDonations}
            color="#3b82f6"
            icon="📦"
            onPress={() => navigation.navigate('AllDonations')}
          />
          <StatCard
            title="Pending"
            value={dashboardStats.pendingDonations}
            color="#f59e0b"
            icon="⏳"
            subtitle="Need assignment"
          />
          <StatCard
            title="Completed"
            value={dashboardStats.completedDonations}
            color="#10b981"
            icon="✅"
            subtitle="Successfully delivered"
          />
          <StatCard
            title="Success Rate"
            value={`${dashboardStats.successRate}%`}
            color="#8b5cf6"
            icon="📊"
          />
        </View>
      </View>

      {/* User Management Stats */}
      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>User Management</Text>
        <View style={styles.statsGrid}>
          <StatCard
            title="Total Users"
            value={dashboardStats.totalUsers}
            color="#22c55e"
            icon="👥"
            onPress={() => navigation.navigate('UserManagement')}
          />
          <StatCard
            title="NGO Partners"
            value={dashboardStats.totalNGOs}
            color="#f97316"
            icon="🏢"
            subtitle="Active partners"
          />
          <StatCard
            title="Admins"
            value={dashboardStats.totalAdmins}
            color="#ef4444"
            icon="👨‍💼"
            subtitle="System admins"
          />
          <StatCard
            title="Avg Response"
            value={`${dashboardStats.avgResponseTime}m`}
            color="#06b6d4"
            icon="⚡"
            subtitle="Response time"
          />
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsContainer}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <QuickAction
          title="Manage Users"
          description="View and manage user accounts"
          icon="👥"
          onPress={() => navigation.navigate('UserManagement')}
          color="#22c55e"
        />
        <QuickAction
          title="All Donations"
          description="View and manage all donations"
          icon="📦"
          onPress={() => navigation.navigate('AllDonations')}
          color="#3b82f6"
        />
        <QuickAction
          title="NGO Management"
          description="Manage NGO accounts and settings"
          icon="🏢"
          onPress={() => navigation.navigate('NGOManagement')}
          color="#f97316"
        />
        <QuickAction
          title="System Analytics"
          description="View detailed system analytics"
          icon="📊"
          onPress={() => navigation.navigate('Analytics')}
          color="#8b5cf6"
        />
        <QuickAction
          title="Batch Operations"
          description="Perform batch assignments and updates"
          icon="⚡"
          onPress={() => navigation.navigate('BatchOperations')}
          color="#ef4444"
        />
      </View>

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <View style={styles.activityContainer}>
          <View style={styles.activityHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity onPress={() => navigation.navigate('ActivityLog')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          {recentActivity.slice(0, 5).map((activity, index) => (
            <ActivityItem key={index} activity={activity} />
          ))}
        </View>
      )}

      {/* System Health */}
      <View style={styles.healthContainer}>
        <Text style={styles.sectionTitle}>System Health</Text>
        <View style={styles.healthCard}>
          <View style={styles.healthItem}>
            <Text style={styles.healthIcon}>🟢</Text>
            <Text style={styles.healthText}>Database: Online</Text>
          </View>
          <View style={styles.healthItem}>
            <Text style={styles.healthIcon}>🟢</Text>
            <Text style={styles.healthText}>API: Responsive</Text>
          </View>
          <View style={styles.healthItem}>
            <Text style={styles.healthIcon}>🟢</Text>
            <Text style={styles.healthText}>NGO Assignment: Active</Text>
          </View>
        </View>
      </View>

      {/* Performance Tips */}
      <View style={styles.tipsContainer}>
        <Text style={styles.sectionTitle}>Admin Tips</Text>
        <View style={styles.tipCard}>
          <Text style={styles.tipText}>
            💡 Monitor donation assignment rates to ensure optimal NGO coverage
          </Text>
        </View>
        <View style={styles.tipCard}>
          <Text style={styles.tipText}>
            📊 Review system analytics weekly to identify improvement opportunities
          </Text>
        </View>
        <View style={styles.tipCard}>
          <Text style={styles.tipText}>
            ⚡ Use batch operations for efficient bulk management tasks
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
    backgroundColor: '#ef4444',
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
  statTextContainer: {
    flex: 1,
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
  statSubtitle: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 1,
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
  activityContainer: {
    padding: 20,
    paddingTop: 0,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    color: '#ef4444',
    fontWeight: '600',
  },
  activityItem: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  activityIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  healthContainer: {
    padding: 20,
    paddingTop: 0,
  },
  healthCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  healthItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  healthIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  healthText: {
    fontSize: 14,
    color: '#374151',
  },
  tipsContainer: {
    padding: 20,
    paddingTop: 0,
    paddingBottom: 40,
  },
  tipCard: {
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#ef4444',
  },
  tipText: {
    fontSize: 14,
    color: '#dc2626',
    lineHeight: 20,
  },
});

export default AdminDashboardScreen;









