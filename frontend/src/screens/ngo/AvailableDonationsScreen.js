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
import * as Location from 'expo-location';
import { useAuth } from '../../context/AuthContext';
import { donationAPI } from '../../services/api';

const AvailableDonationsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [donations, setDonations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    initializeAndLoad();
  }, []);

  const initializeAndLoad = async () => {
    try {
      let lat = user?.profile?.lat;
      let lng = user?.profile?.lng;

      if (lat === undefined || lng === undefined) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({});
          lat = location.coords.latitude;
          lng = location.coords.longitude;
        }
      }

      await loadAvailableDonations(lat, lng);
    } catch (e) {
      await loadAvailableDonations(undefined, undefined);
    }
  };

  const loadAvailableDonations = async (lat, lng) => {
    try {
      setIsLoading(true);
      const params = {};
      if (lat !== undefined && lng !== undefined) {
        params.lat = lat;
        params.lng = lng;
        params.maxDistance = user.profile?.serviceRadius || 20;
      }
      const response = await donationAPI.getAvailableDonations(params);
      setDonations(response.data.donations);
    } catch (error) {
      console.error('Error loading available donations:', error);
      Alert.alert('Error', 'Failed to load available donations');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await initializeAndLoad();
    setRefreshing(false);
  };

  const handleAcceptDonation = async (donation) => {
    try {
      // Accept only if pending and unassigned
      if (donation.status !== 'pending' || donation.ngoId) {
        Alert.alert('Unavailable', 'This donation is no longer available.');
        await initializeAndLoad();
        return;
      }

      // Backend requires permission; if server forbids, show message and refresh
      await donationAPI.updateDonation(donation._id, {
        status: 'assigned',
        ngoId: user._id,
        assignedAt: new Date().toISOString(),
      });
      
      Alert.alert(
        'Success',
        'Donation accepted! You can now proceed with pickup.',
        [{ text: 'OK', onPress: () => initializeAndLoad() }]
      );
    } catch (error) {
      console.error('Error accepting donation:', error);
      const msg = error.response?.status === 403
        ? 'Not authorized. This donation may already be assigned.'
        : 'Failed to accept donation';
      Alert.alert('Error', msg);
      await initializeAndLoad();
    }
  };

  const handleDeclineDonation = async (donationId) => {
    Alert.alert(
      'Decline Donation',
      'Are you sure you want to decline this donation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            try {
              await donationAPI.updateDonation(donationId, {
                status: 'pending',
                ngoId: null,
                assignedAt: null,
              });
              await initializeAndLoad();
            } catch (error) {
              console.error('Error declining donation:', error);
              const msg = error.response?.status === 403
                ? 'Not authorized. Only assigned NGO can decline.'
                : 'Failed to decline donation';
              Alert.alert('Error', msg);
            }
          },
        },
      ]
    );
  };

  const showDonationDetails = (donation) => {
    setSelectedDonation(donation);
    setShowDetailsModal(true);
  };

  const formatDistance = (distance) => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance.toFixed(1)}km`;
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const donationTime = new Date(dateString);
    const diffMs = now - donationTime;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours > 0) {
      return `${diffHours}h ago`;
    }
    return `${diffMinutes}m ago`;
  };

  const DonationCard = ({ item }) => (
    <View style={styles.donationCard}>
      <View style={styles.donationHeader}>
        <Text style={styles.foodItem}>{item.foodItem}</Text>
        <Text style={styles.distance}>
          {formatDistance(item.distance || 0)}
        </Text>
      </View>

      <View style={styles.donationDetails}>
        <Text style={styles.quantity}>
          {item.quantity} {item.quantityUnit}
        </Text>
        <Text style={styles.timeAgo}>
          Posted {formatTimeAgo(item.createdAt)}
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

        <TouchableOpacity
          style={styles.acceptButton}
          onPress={() => handleAcceptDonation(item)}
        >
          <Text style={styles.acceptButtonText}>Accept</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.freshnessIndicator}>
        <Text style={styles.freshnessText}>
          Freshness: {item.isFresh ? '✅ Fresh' : '⚠️ Check'}
        </Text>
      </View>
    </View>
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
                <Text style={styles.detailTitle}>Location</Text>
                <Text style={styles.detailText}>
                  📍 {selectedDonation.location?.address || 'Location coordinates provided'}
                </Text>
                <Text style={styles.detailText}>
                  Distance: {formatDistance(selectedDonation.distance || 0)}
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
            <TouchableOpacity
              style={styles.modalDeclineButton}
              onPress={() => {
                setShowDetailsModal(false);
                handleDeclineDonation(selectedDonation._id);
              }}
            >
              <Text style={styles.modalDeclineButtonText}>Decline</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalAcceptButton}
              onPress={() => {
                setShowDetailsModal(false);
                handleAcceptDonation(selectedDonation._id);
              }}
            >
              <Text style={styles.modalAcceptButtonText}>Accept Donation</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading available donations...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Available Donations</Text>
        <Text style={styles.subtitle}>
          {donations.length} donations near you
        </Text>
      </View>

      <FlatList
        data={donations}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <DonationCard item={item} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🍽️</Text>
            <Text style={styles.emptyTitle}>No Donations Available</Text>
            <Text style={styles.emptyText}>
              Check back later for new food donations in your area.
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
  distance: {
    fontSize: 14,
    color: '#22c55e',
    fontWeight: '600',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
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
  timeAgo: {
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
    marginBottom: 8,
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
  acceptButton: {
    backgroundColor: '#22c55e',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  freshnessIndicator: {
    alignItems: 'flex-end',
  },
  freshnessText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '500',
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
  modalDeclineButton: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 12,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  modalDeclineButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  modalAcceptButton: {
    backgroundColor: '#22c55e',
    borderRadius: 8,
    padding: 12,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  modalAcceptButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AvailableDonationsScreen;

