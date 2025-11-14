import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Image,
  Modal,
  ScrollView,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { donationAPI } from '../../services/api';

const MyDonationsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [donations, setDonations] = useState([]);
  const [filteredDonations, setFilteredDonations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');

  const statusFilters = [
    { key: 'all', label: 'All', count: 0 },
    { key: 'assigned', label: 'Assigned', count: 0 },
    { key: 'picked', label: 'Picked', count: 0 },
    { key: 'delivered', label: 'Delivered', count: 0 },
  ];

  useEffect(() => {
    loadMyDonations();
  }, []);

  useEffect(() => {
    filterDonations();
  }, [donations, activeFilter]);

  const loadMyDonations = async () => {
    try {
      setIsLoading(true);
      const ngoId = user?.id || user?._id;
      const response = await donationAPI.getNGODonations(ngoId);
      setDonations(response.data.donations);
    } catch (error) {
      console.error('Error loading my donations:', error);
      Alert.alert('Error', 'Failed to load your donations');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMyDonations();
    setRefreshing(false);
  };

  const filterDonations = () => {
    let filtered = donations;
    
    // Update filter counts
    const updatedFilters = statusFilters.map(filter => ({
      ...filter,
      count: donations.filter(d => 
        filter.key === 'all' ? true : d.status === filter.key
      ).length
    }));

    if (activeFilter !== 'all') {
      filtered = donations.filter(donation => donation.status === activeFilter);
    }

    setFilteredDonations(filtered);
  };

  const updateDonationStatus = async (donationId, newStatus) => {
    try {
      const updateData = { status: newStatus };
      
      if (newStatus === 'picked') {
        updateData.pickedAt = new Date().toISOString();
      } else if (newStatus === 'delivered') {
        updateData.deliveredAt = new Date().toISOString();
      }

      await donationAPI.updateDonation(donationId, updateData);
      
      Alert.alert(
        'Success',
        `Donation marked as ${newStatus}!`,
        [{ text: 'OK', onPress: () => loadMyDonations() }]
      );
    } catch (error) {
      console.error('Error updating donation status:', error);
      Alert.alert('Error', 'Failed to update donation status');
    }
  };

  const confirmStatusUpdate = (donation, newStatus) => {
    const actionText = newStatus === 'picked' ? 'picked up' : 'delivered';
    
    Alert.alert(
      `Mark as ${actionText}`,
      `Are you sure you want to mark this donation as ${actionText}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => updateDonationStatus(donation._id, newStatus),
        },
      ]
    );
  };

  const showDonationDetails = (donation) => {
    setSelectedDonation(donation);
    setShowDetailsModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'assigned': return '#f59e0b';
      case 'picked': return '#3b82f6';
      case 'delivered': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'assigned': return '📋';
      case 'picked': return '🚚';
      case 'delivered': return '✅';
      default: return '⏳';
    }
  };

  const DonationCard = ({ item }) => (
    <View style={styles.donationCard}>
      <View style={styles.donationHeader}>
        <Text style={styles.foodItem}>{item.foodItem}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusIcon}>{getStatusIcon(item.status)}</Text>
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.donationDetails}>
        <Text style={styles.quantity}>
          {item.quantity} {item.quantityUnit}
        </Text>
        <Text style={styles.assignedDate}>
          Assigned: {new Date(item.assignedAt).toLocaleDateString()}
        </Text>
      </View>

      {item.description && (
        <Text style={styles.description} numberOfLines={2}>
          {item.description}
        </Text>
      )}

      <View style={styles.donationActions}>
        <TouchableOpacity
          style={styles.viewButton}
          onPress={() => showDonationDetails(item)}
        >
          <Text style={styles.viewButtonText}>View Details</Text>
        </TouchableOpacity>

        {item.status === 'assigned' && (
          <TouchableOpacity
            style={styles.pickedButton}
            onPress={() => confirmStatusUpdate(item, 'picked')}
          >
            <Text style={styles.pickedButtonText}>Mark Picked</Text>
          </TouchableOpacity>
        )}

        {item.status === 'picked' && (
          <TouchableOpacity
            style={styles.deliveredButton}
            onPress={() => confirmStatusUpdate(item, 'delivered')}
          >
            <Text style={styles.deliveredButtonText}>Mark Delivered</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.progressBar}>
        <View style={[
          styles.progressFill,
          {
            width: item.status === 'assigned' ? '33%' : 
                   item.status === 'picked' ? '66%' : '100%',
            backgroundColor: getStatusColor(item.status)
          }
        ]} />
      </View>
    </View>
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

  const DonationDetailsModal = () => (
    <Modal
      visible={showDetailsModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowDetailsModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Donation Details</Text>
            <TouchableOpacity onPress={() => setShowDetailsModal(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          {selectedDonation && (
            <ScrollView style={styles.modalBody}>
              <View style={styles.detailSection}>
                <Text style={styles.detailTitle}>Food Information</Text>
                <Text style={styles.detailText}>
                  <Text style={styles.detailLabel}>Item:</Text> {selectedDonation.foodItem}
                </Text>
                <Text style={styles.detailText}>
                  <Text style={styles.detailLabel}>Quantity:</Text> {selectedDonation.quantity} {selectedDonation.quantityUnit}
                </Text>
                <Text style={styles.detailText}>
                  <Text style={styles.detailLabel}>Cooked:</Text> {new Date(selectedDonation.cookedTime).toLocaleString()}
                </Text>
                {selectedDonation.description && (
                  <Text style={styles.detailText}>
                    <Text style={styles.detailLabel}>Description:</Text> {selectedDonation.description}
                  </Text>
                )}
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailTitle}>Status Information</Text>
                <Text style={styles.detailText}>
                  <Text style={styles.detailLabel}>Current Status:</Text> {selectedDonation.status}
                </Text>
                <Text style={styles.detailText}>
                  <Text style={styles.detailLabel}>Assigned:</Text> {new Date(selectedDonation.assignedAt).toLocaleString()}
                </Text>
                {selectedDonation.pickedAt && (
                  <Text style={styles.detailText}>
                    <Text style={styles.detailLabel}>Picked:</Text> {new Date(selectedDonation.pickedAt).toLocaleString()}
                  </Text>
                )}
                {selectedDonation.deliveredAt && (
                  <Text style={styles.detailText}>
                    <Text style={styles.detailLabel}>Delivered:</Text> {new Date(selectedDonation.deliveredAt).toLocaleString()}
                  </Text>
                )}
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailTitle}>Location</Text>
                <Text style={styles.detailText}>
                  📍 {selectedDonation.location?.address || 'Location coordinates provided'}
                </Text>
              </View>

              {selectedDonation.pickupInstructions && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailTitle}>Pickup Instructions</Text>
                  <Text style={styles.detailText}>{selectedDonation.pickupInstructions}</Text>
                </View>
              )}

              {selectedDonation.photoURL && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailTitle}>Photo</Text>
                  <Image source={{ uri: selectedDonation.photoURL }} style={styles.donationPhoto} />
                </View>
              )}
            </ScrollView>
          )}

          <View style={styles.modalActions}>
            {selectedDonation?.status === 'assigned' && (
              <TouchableOpacity
                style={styles.modalPickedButton}
                onPress={() => {
                  setShowDetailsModal(false);
                  confirmStatusUpdate(selectedDonation, 'picked');
                }}
              >
                <Text style={styles.modalPickedButtonText}>Mark as Picked</Text>
              </TouchableOpacity>
            )}

            {selectedDonation?.status === 'picked' && (
              <TouchableOpacity
                style={styles.modalDeliveredButton}
                onPress={() => {
                  setShowDetailsModal(false);
                  confirmStatusUpdate(selectedDonation, 'delivered');
                }}
              >
                <Text style={styles.modalDeliveredButtonText}>Mark as Delivered</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading your donations...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Donations</Text>
        <Text style={styles.subtitle}>
          Manage your assigned donations
        </Text>
      </View>

      {/* Status Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {statusFilters.map((filter) => (
            <FilterButton key={filter.key} filter={filter} />
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredDonations}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <DonationCard item={item} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyTitle}>
              {activeFilter === 'all' ? 'No Donations Assigned' : `No ${activeFilter} Donations`}
            </Text>
            <Text style={styles.emptyText}>
              {activeFilter === 'all' 
                ? 'You haven\'t been assigned any donations yet.'
                : `You don't have any ${activeFilter} donations.`}
            </Text>
          </View>
        }
      />

      <DonationDetailsModal />
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
    backgroundColor: '#22c55e',
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
    backgroundColor: '#22c55e',
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
    color: '#22c55e',
    backgroundColor: '#ffffff',
  },
  listContainer: {
    padding: 16,
  },
  donationCard: {
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
  donationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  foodItem: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  statusText: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  donationDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  quantity: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  assignedDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  donationActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  viewButton: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  viewButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
  pickedButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  pickedButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  deliveredButton: {
    backgroundColor: '#10b981',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  deliveredButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
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
  donationPhoto: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginTop: 8,
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  modalPickedButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    padding: 12,
    flex: 1,
    alignItems: 'center',
  },
  modalPickedButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalDeliveredButton: {
    backgroundColor: '#10b981',
    borderRadius: 8,
    padding: 12,
    flex: 1,
    alignItems: 'center',
  },
  modalDeliveredButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MyDonationsScreen;

