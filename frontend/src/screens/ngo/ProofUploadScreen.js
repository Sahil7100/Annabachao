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
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { donationAPI } from '../../services/api';

const ProofUploadScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [donations, setDonations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadPickedDonations();
    requestCameraPermission();
  }, []);

  const requestCameraPermission = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Camera permission is needed to upload proof images.'
        );
      }
    } catch (error) {
      console.error('Error requesting camera permission:', error);
    }
  };

  const loadPickedDonations = async () => {
    try {
      setIsLoading(true);
      const response = await donationAPI.getDonationsByNGO(user._id);
      // Filter only picked donations that need proof
      const pickedDonations = response.data.donations.filter(
        donation => donation.status === 'picked'
      );
      setDonations(pickedDonations);
    } catch (error) {
      console.error('Error loading picked donations:', error);
      Alert.alert('Error', 'Failed to load picked donations');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPickedDonations();
    setRefreshing(false);
  };

  const pickImage = async () => {
    Alert.alert(
      'Select Proof Image',
      'Choose how you want to add proof image',
      [
        { text: 'Camera', onPress: () => openCamera() },
        { text: 'Gallery', onPress: () => openGallery() },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const openCamera = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        await uploadProofImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error opening camera:', error);
      Alert.alert('Error', 'Failed to open camera');
    }
  };

  const openGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        await uploadProofImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error opening gallery:', error);
      Alert.alert('Error', 'Failed to open gallery');
    }
  };

  const uploadProofImage = async (imageUri) => {
    try {
      setUploading(true);
      
      // Create form data for file upload
      const formData = new FormData();
      formData.append('proofImage', {
        uri: imageUri,
        type: 'image/jpeg',
        name: `proof_${selectedDonation._id}_${Date.now()}.jpg`,
      });

      // Upload proof image
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/donations/${selectedDonation._id}/proof`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${await AsyncStorage.getItem('token')}`,
          },
          body: formData,
        }
      );

      if (response.ok) {
        Alert.alert(
          'Success',
          'Proof image uploaded successfully!',
          [{ text: 'OK', onPress: () => {
            setShowUploadModal(false);
            loadPickedDonations();
          }}]
        );
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Error uploading proof image:', error);
      Alert.alert('Error', 'Failed to upload proof image');
    } finally {
      setUploading(false);
    }
  };

  const markAsDelivered = async (donation) => {
    Alert.alert(
      'Mark as Delivered',
      'Have you successfully delivered this donation and uploaded proof?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Mark Delivered',
          onPress: async () => {
            try {
              await donationAPI.updateDonation(donation._id, {
                status: 'delivered',
                deliveredAt: new Date().toISOString(),
              });
              
              Alert.alert(
                'Success',
                'Donation marked as delivered!',
                [{ text: 'OK', onPress: () => loadPickedDonations() }]
              );
            } catch (error) {
              console.error('Error marking as delivered:', error);
              Alert.alert('Error', 'Failed to mark as delivered');
            }
          },
        },
      ]
    );
  };

  const DonationCard = ({ item }) => (
    <View style={styles.donationCard}>
      <View style={styles.donationHeader}>
        <Text style={styles.foodItem}>{item.foodItem}</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusIcon}>🚚</Text>
          <Text style={styles.statusText}>PICKED</Text>
        </View>
      </View>

      <View style={styles.donationDetails}>
        <Text style={styles.quantity}>
          {item.quantity} {item.quantityUnit}
        </Text>
        <Text style={styles.pickedDate}>
          Picked: {new Date(item.pickedAt).toLocaleDateString()}
        </Text>
      </View>

      {item.description && (
        <Text style={styles.description} numberOfLines={2}>
          {item.description}
        </Text>
      )}

      <View style={styles.donationActions}>
        <TouchableOpacity
          style={styles.uploadProofButton}
          onPress={() => {
            setSelectedDonation(item);
            setShowUploadModal(true);
          }}
        >
          <Text style={styles.uploadProofButtonText}>📸 Upload Proof</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deliveredButton}
          onPress={() => markAsDelivered(item)}
        >
          <Text style={styles.deliveredButtonText}>✅ Mark Delivered</Text>
        </TouchableOpacity>
      </View>

      {item.proofImages && item.proofImages.length > 0 && (
        <View style={styles.proofSection}>
          <Text style={styles.proofTitle}>Proof Images:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {item.proofImages.map((image, index) => (
              <Image
                key={index}
                source={{ uri: image }}
                style={styles.proofImage}
              />
            ))}
          </ScrollView>
        </View>
      )}

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: '66%', backgroundColor: '#3b82f6' }]} />
      </View>
    </View>
  );

  const UploadModal = () => (
    <Modal
      visible={showUploadModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowUploadModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Upload Proof Image</Text>
            <TouchableOpacity onPress={() => setShowUploadModal(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          {selectedDonation && (
            <View style={styles.modalBody}>
              <Text style={styles.modalText}>
                Upload a photo as proof of pickup/delivery for:
              </Text>
              <Text style={styles.selectedDonation}>
                {selectedDonation.foodItem} ({selectedDonation.quantity} {selectedDonation.quantityUnit})
              </Text>

              <TouchableOpacity
                style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
                onPress={pickImage}
                disabled={uploading}
              >
                <Text style={styles.uploadButtonText}>
                  {uploading ? 'Uploading...' : '📸 Take/Select Photo'}
                </Text>
              </TouchableOpacity>

              <View style={styles.uploadTips}>
                <Text style={styles.tipTitle}>💡 Upload Tips:</Text>
                <Text style={styles.tipText}>
                  • Take clear photos of the food being picked up
                </Text>
                <Text style={styles.tipText}>
                  • Include delivery location if applicable
                </Text>
                <Text style={styles.tipText}>
                  • Ensure good lighting for better image quality
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading picked donations...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Upload Proof</Text>
        <Text style={styles.subtitle}>
          Upload proof images for picked donations
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
            <Text style={styles.emptyIcon}>🚚</Text>
            <Text style={styles.emptyTitle}>No Picked Donations</Text>
            <Text style={styles.emptyText}>
              You don't have any picked donations that need proof upload.
            </Text>
            <TouchableOpacity
              style={styles.viewDonationsButton}
              onPress={() => navigation.navigate('AvailableDonations')}
            >
              <Text style={styles.viewDonationsButtonText}>
                View Available Donations
              </Text>
            </TouchableOpacity>
          </View>
        }
      />

      <UploadModal />
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
    backgroundColor: '#8b5cf6',
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
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
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
  pickedDate: {
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
  uploadProofButton: {
    backgroundColor: '#8b5cf6',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  uploadProofButtonText: {
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
  proofSection: {
    marginBottom: 12,
  },
  proofTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  proofImage: {
    width: 80,
    height: 60,
    borderRadius: 8,
    marginRight: 8,
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
    marginBottom: 20,
  },
  viewDonationsButton: {
    backgroundColor: '#22c55e',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  viewDonationsButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
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
  modalText: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 12,
    lineHeight: 22,
  },
  selectedDonation: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 20,
    padding: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  uploadButton: {
    backgroundColor: '#8b5cf6',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  uploadButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  uploadButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  uploadTips: {
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#3b82f6',
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 12,
    color: '#1e40af',
    marginBottom: 4,
    lineHeight: 16,
  },
});

export default ProofUploadScreen;

