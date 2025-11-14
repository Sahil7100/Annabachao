import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { adminAPI } from '../../services/api';

const UserManagementScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');

  const roleFilters = [
    { key: 'all', label: 'All Users', count: 0 },
    { key: 'user', label: 'Donors', count: 0 },
    { key: 'ngo', label: 'NGOs', count: 0 },
    { key: 'admin', label: 'Admins', count: 0 },
  ];

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchQuery, activeFilter]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const response = await adminAPI.getAllUsers();
      setUsers(response.data.users);
    } catch (error) {
      console.error('Error loading users:', error);
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUsers();
    setRefreshing(false);
  };

  const filterUsers = () => {
    let filtered = users;
    
    // Update filter counts
    const updatedFilters = roleFilters.map(filter => ({
      ...filter,
      count: users.filter(u => 
        filter.key === 'all' ? true : u.role === filter.key
      ).length
    }));

    // Apply role filter
    if (activeFilter !== 'all') {
      filtered = filtered.filter(user => user.role === activeFilter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredUsers(filtered);
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    Alert.alert(
      `${newStatus === 'active' ? 'Activate' : 'Deactivate'} User`,
      `Are you sure you want to ${newStatus} this user?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await adminAPI.updateUserStatus(userId, { status: newStatus });
              Alert.alert(
                'Success',
                `User ${newStatus}d successfully!`,
                [{ text: 'OK', onPress: () => loadUsers() }]
              );
            } catch (error) {
              console.error('Error updating user status:', error);
              Alert.alert('Error', 'Failed to update user status');
            }
          },
        },
      ]
    );
  };

  const deleteUser = async (userId, userName) => {
    Alert.alert(
      'Delete User',
      `Are you sure you want to permanently delete ${userName}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await adminAPI.deleteUser(userId);
              Alert.alert(
                'Success',
                'User deleted successfully!',
                [{ text: 'OK', onPress: () => loadUsers() }]
              );
            } catch (error) {
              console.error('Error deleting user:', error);
              Alert.alert('Error', 'Failed to delete user');
            }
          },
        },
      ]
    );
  };

  const showUserDetails = (userData) => {
    setSelectedUser(userData);
    setShowUserModal(true);
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return '#ef4444';
      case 'ngo': return '#f97316';
      case 'user': return '#22c55e';
      default: return '#6b7280';
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return '👨‍💼';
      case 'ngo': return '🏢';
      case 'user': return '👤';
      default: return '❓';
    }
  };

  const UserCard = ({ item }) => (
    <TouchableOpacity
      style={styles.userCard}
      onPress={() => showUserDetails(item)}
    >
      <View style={styles.userHeader}>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.name}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
        </View>
        <View style={[styles.roleBadge, { backgroundColor: getRoleColor(item.role) }]}>
          <Text style={styles.roleIcon}>{getRoleIcon(item.role)}</Text>
          <Text style={styles.roleText}>{item.role.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.userDetails}>
        <Text style={styles.userDetail}>
          Joined: {new Date(item.createdAt).toLocaleDateString()}
        </Text>
        <Text style={styles.userDetail}>
          Status: {item.status || 'active'}
        </Text>
      </View>

      <View style={styles.userActions}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            item.status === 'active' ? styles.deactivateButton : styles.activateButton
          ]}
          onPress={() => toggleUserStatus(item._id, item.status)}
        >
          <Text style={styles.actionButtonText}>
            {item.status === 'active' ? 'Deactivate' : 'Activate'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteUser(item._id, item.name)}
        >
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const FilterButton = ({ filter }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        activeFilter === filter.key && styles.activeFilterButton,
      ]}
      onPress={() => setActiveFilter(filter.key)}
    >
      <Text
        style={[
          styles.filterButtonText,
          activeFilter === filter.key && styles.activeFilterButtonText,
        ]}
      >
        {filter.label}
      </Text>
      <Text
        style={[
          styles.filterCount,
          activeFilter === filter.key && styles.activeFilterCount,
        ]}
      >
        {filter.count}
      </Text>
    </TouchableOpacity>
  );

  const UserDetailsModal = () => (
    <Modal
      visible={showUserModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowUserModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>User Details</Text>
            <TouchableOpacity onPress={() => setShowUserModal(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          {selectedUser && (
            <ScrollView style={styles.modalBody}>
              <View style={styles.detailSection}>
                <Text style={styles.detailTitle}>Basic Information</Text>
                <Text style={styles.detailText}>
                  <Text style={styles.detailLabel}>Name:</Text> {selectedUser.name}
                </Text>
                <Text style={styles.detailText}>
                  <Text style={styles.detailLabel}>Email:</Text> {selectedUser.email}
                </Text>
                <Text style={styles.detailText}>
                  <Text style={styles.detailLabel}>Role:</Text> {selectedUser.role}
                </Text>
                <Text style={styles.detailText}>
                  <Text style={styles.detailLabel}>Status:</Text> {selectedUser.status || 'active'}
                </Text>
                <Text style={styles.detailText}>
                  <Text style={styles.detailLabel}>Joined:</Text> {new Date(selectedUser.createdAt).toLocaleString()}
                </Text>
              </View>

              {selectedUser.profile && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailTitle}>Profile Information</Text>
                  {selectedUser.profile.phone && (
                    <Text style={styles.detailText}>
                      <Text style={styles.detailLabel}>Phone:</Text> {selectedUser.profile.phone}
                    </Text>
                  )}
                  {selectedUser.profile.address && (
                    <View>
                      <Text style={styles.detailText}>
                        <Text style={styles.detailLabel}>Address:</Text>
                      </Text>
                      <Text style={styles.detailText}>
                        {selectedUser.profile.address.street}, {selectedUser.profile.address.city}
                      </Text>
                      <Text style={styles.detailText}>
                        {selectedUser.profile.address.state}, {selectedUser.profile.address.zipCode}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {selectedUser.role === 'ngo' && selectedUser.profile && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailTitle}>NGO Information</Text>
                  {selectedUser.profile.capacity && (
                    <Text style={styles.detailText}>
                      <Text style={styles.detailLabel}>Capacity:</Text> {selectedUser.profile.capacity}
                    </Text>
                  )}
                  {selectedUser.profile.serviceRadius && (
                    <Text style={styles.detailText}>
                      <Text style={styles.detailLabel}>Service Radius:</Text> {selectedUser.profile.serviceRadius} km
                    </Text>
                  )}
                  {selectedUser.profile.workload !== undefined && (
                    <Text style={styles.detailText}>
                      <Text style={styles.detailLabel}>Current Workload:</Text> {selectedUser.profile.workload}%
                    </Text>
                  )}
                </View>
              )}
            </ScrollView>
          )}

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.modalActionButton}
              onPress={() => {
                setShowUserModal(false);
                if (selectedUser) {
                  toggleUserStatus(selectedUser._id, selectedUser.status);
                }
              }}
            >
              <Text style={styles.modalActionButtonText}>
                {selectedUser?.status === 'active' ? 'Deactivate' : 'Activate'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading users...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>User Management</Text>
        <Text style={styles.subtitle}>
          Manage user accounts and permissions
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search users by name or email..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Role Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {roleFilters.map((filter) => (
            <FilterButton key={filter.key} filter={filter} />
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <UserCard item={item} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No Users Found' : 'No Users Available'}
            </Text>
            <Text style={styles.emptyText}>
              {searchQuery 
                ? 'Try adjusting your search criteria'
                : 'No users match the selected filter'}
            </Text>
          </View>
        }
      />

      <UserDetailsModal />
    </View>
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
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
    marginTop: 4,
  },
  searchContainer: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchInput: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#374151',
  },
  filtersContainer: {
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
  },
  activeFilterButton: {
    backgroundColor: '#ef4444',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
    marginRight: 6,
  },
  activeFilterButtonText: {
    color: '#ffffff',
  },
  filterCount: {
    fontSize: 12,
    color: '#6b7280',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    textAlign: 'center',
  },
  activeFilterCount: {
    color: '#ef4444',
    backgroundColor: '#ffffff',
  },
  listContainer: {
    padding: 16,
  },
  userCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#6b7280',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  roleText: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  userDetails: {
    marginBottom: 12,
  },
  userDetail: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 2,
  },
  userActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  activateButton: {
    backgroundColor: '#22c55e',
  },
  deactivateButton: {
    backgroundColor: '#f59e0b',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    margin: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
  },
  closeButton: {
    fontSize: 20,
    color: '#6b7280',
  },
  modalBody: {
    padding: 20,
  },
  detailSection: {
    marginBottom: 20,
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
    lineHeight: 20,
  },
  detailLabel: {
    fontWeight: '600',
    color: '#374151',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  modalActionButton: {
    backgroundColor: '#ef4444',
    borderRadius: 8,
    padding: 12,
    flex: 1,
    alignItems: 'center',
  },
  modalActionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default UserManagementScreen;









