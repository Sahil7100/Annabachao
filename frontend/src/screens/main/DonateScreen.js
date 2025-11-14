import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import * as ImagePicker from 'expo-image-picker';
import { donationAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const DonateScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    foodItem: '',
    quantity: '',
    quantityUnit: 'servings',
    timeSinceCooked: '',
    description: '',
    pickupInstructions: '',
    location: null,
    photoURL: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [locationPermission, setLocationPermission] = useState(false);
  const [manualAddress, setManualAddress] = useState('');
  const [manualCity, setManualCity] = useState('');
  const [mapRegion, setMapRegion] = useState(null);
  const [pinCoords, setPinCoords] = useState(null);
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Food items dropdown options
  const foodItems = [
    'Rice',
    'Roti/Chapati',
    'Paneer',
    'Biryani',
    'Dal/Lentils',
    'Vegetable Curry',
    'Pizza',
    'Sandwiches',
    'Pasta',
    'Soup',
    'Salad',
    'Fruits',
    'Bread',
    'Sweets/Desserts',
    'Other',
  ];

  // Time since cooked options
  const timeOptions = [
    { label: 'Just cooked (0-30 minutes)', value: '0.5' },
    { label: '1 hour ago', value: '1' },
    { label: '2 hours ago', value: '2' },
    { label: '3 hours ago', value: '3' },
    { label: '4 hours ago', value: '4' },
    { label: '5 hours ago', value: '5' },
    { label: '6 hours ago', value: '6' },
    { label: 'More than 6 hours', value: '8' },
  ];

  useEffect(() => {
    requestLocationPermission();
    requestCameraPermission();
  }, []);

  const requestCameraPermission = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Camera permission is needed to upload photos of your donation.'
        );
      }
    } catch (error) {
      console.error('Error requesting camera permission:', error);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Location permission is needed to use pinpoint.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      let addressLine = manualAddress;
      let cityLine = manualCity;
      try {
        const rev = await Location.reverseGeocodeAsync(coords);
        if (rev && rev.length > 0) {
          const r = rev[0];
          const parts = [r.name, r.street, r.district, r.subregion].filter(Boolean);
          addressLine = addressLine || parts.join(', ');
          cityLine = cityLine || r.city || r.subregion || r.region || '';
        }
      } catch (_) {}

      setPinCoords(coords);
      setMapRegion({ ...coords, latitudeDelta: 0.01, longitudeDelta: 0.01 });
      setFormData(prev => ({
        ...prev,
        location: { lat: coords.latitude, lng: coords.longitude, address: addressLine || 'Current Location', city: cityLine || 'Unknown' },
      }));
    } catch (e) {
      Alert.alert('Error', 'Unable to fetch current location');
    }
  };

  const geocodeAddress = async () => {
    if (!manualAddress || !manualCity) {
      Alert.alert('Error', 'Please enter address and city');
      return;
    }
    setIsGeocoding(true);
    try {
      const results = await Location.geocodeAsync(`${manualAddress}, ${manualCity}`);
      if (results && results.length > 0) {
        const best = results[0];
        const coords = { latitude: best.latitude, longitude: best.longitude };
        setPinCoords(coords);
        setMapRegion({ ...coords, latitudeDelta: 0.01, longitudeDelta: 0.01 });
        setFormData(prev => ({
          ...prev,
          location: { lat: coords.latitude, lng: coords.longitude, address: manualAddress, city: manualCity },
        }));
      } else {
        Alert.alert('Not found', 'Could not geocode the entered address');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to geocode address');
    } finally {
      setIsGeocoding(false);
    }
  };

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setLocationPermission(true);
        // Do not auto-pick location; let the user choose Current Location or Enter Address
      } else {
        Alert.alert(
          'Location Permission Required',
          'Please enable location access to create donations.'
        );
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
    }
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const pickImage = async () => {
    Alert.alert(
      'Select Photo',
      'Choose how you want to add a photo',
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
        setFormData(prev => ({ ...prev, photoURL: result.assets[0].uri }));
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
        setFormData(prev => ({ ...prev, photoURL: result.assets[0].uri }));
      }
    } catch (error) {
      console.error('Error opening gallery:', error);
      Alert.alert('Error', 'Failed to open gallery');
    }
  };

  const validateFreshness = (timeSinceCooked) => {
    const hours = parseFloat(timeSinceCooked);
    if (hours > 6) {
      Alert.alert(
        'Food Too Old',
        'Food cooked more than 6 hours ago may not be safe to donate. Please consider if the food is still fresh and safe to consume.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Continue Anyway', 
            onPress: () => true,
            style: 'destructive'
          },
        ]
      );
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.foodItem || !formData.quantity || !formData.timeSinceCooked) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!formData.location) {
      Alert.alert('Error', 'Location is required. Please enable location access or enter address.');
      return;
    }

    // Validate freshness
    if (!validateFreshness(formData.timeSinceCooked)) {
      return;
    }

    setIsLoading(true);

    try {
      // Calculate cooked time based on current time and time since cooked
      const now = new Date();
      const hoursAgo = parseFloat(formData.timeSinceCooked);
      const cookedTime = new Date(now.getTime() - (hoursAgo * 60 * 60 * 1000));

      const donationData = {
        foodItem: formData.foodItem,
        quantity: parseInt(formData.quantity),
        quantityUnit: formData.quantityUnit,
        cookedTime: cookedTime.toISOString(),
        location: formData.location,
        description: formData.description,
        pickupInstructions: formData.pickupInstructions,
      };

      // Only include photoURL if it's a remote image URL; ignore local file URIs to satisfy backend validation
      if (formData.photoURL && /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(formData.photoURL)) {
        donationData.photoURL = formData.photoURL;
      }

      const response = await donationAPI.createDonation(donationData);

      // Navigate to success screen
      navigation.navigate('DonationSuccess', {
        donation: response.data.donation,
        assignedNGO: response.data.donation.ngoId,
      });

    } catch (error) {
      console.error('Error creating donation:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to create donation');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      foodItem: '',
      quantity: '',
      quantityUnit: 'servings',
      timeSinceCooked: '',
      description: '',
      pickupInstructions: '',
      location: formData.location, // Keep location
      photoURL: null,
    });
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Donate Food</Text>
          <Text style={styles.subtitle}>Help reduce food waste</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Food Item *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.foodItem}
              onValueChange={(value) => updateFormData('foodItem', value)}
              style={styles.picker}
            >
              <Picker.Item label="Select food item..." value="" />
              {foodItems.map((item, index) => (
                <Picker.Item key={index} label={item} value={item} />
              ))}
            </Picker>
          </View>

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Text style={styles.label}>Quantity *</Text>
              <TextInput
                style={styles.input}
                value={formData.quantity}
                onChangeText={(value) => updateFormData('quantity', value)}
                placeholder="25"
                keyboardType="numeric"
              />
            </View>
            
            <View style={styles.halfWidth}>
              <Text style={styles.label}>Unit</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.quantityUnit}
                  onValueChange={(value) => updateFormData('quantityUnit', value)}
                  style={styles.picker}
                >
                  <Picker.Item label="Servings" value="servings" />
                  <Picker.Item label="Plates" value="plates" />
                  <Picker.Item label="Boxes" value="boxes" />
                  <Picker.Item label="Kg" value="kg" />
                  <Picker.Item label="Pieces" value="pieces" />
                </Picker>
              </View>
            </View>
          </View>

          <Text style={styles.label}>Time Since Cooked *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.timeSinceCooked}
              onValueChange={(value) => updateFormData('timeSinceCooked', value)}
              style={styles.picker}
            >
              <Picker.Item label="Select time since cooked..." value="" />
              {timeOptions.map((option, index) => (
                <Picker.Item key={index} label={option.label} value={option.value} />
              ))}
            </Picker>
          </View>

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.description}
            onChangeText={(value) => updateFormData('description', value)}
            placeholder="Brief description of the food..."
            multiline
            numberOfLines={3}
          />

          <Text style={styles.label}>Pickup Instructions</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.pickupInstructions}
            onChangeText={(value) => updateFormData('pickupInstructions', value)}
            placeholder="Special instructions for pickup..."
            multiline
            numberOfLines={2}
          />

          <Text style={styles.label}>Photo (Optional)</Text>
          <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
            {formData.photoURL ? (
              <View style={styles.photoContainer}>
                <Image source={{ uri: formData.photoURL }} style={styles.photoPreview} />
                <Text style={styles.photoText}>Tap to change photo</Text>
              </View>
            ) : (
              <View style={styles.photoPlaceholder}>
                <Text style={styles.photoPlaceholderText}>📷</Text>
                <Text style={styles.photoPlaceholderLabel}>Add Photo</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.locationSection}>
            <Text style={styles.label}>Location</Text>
            {formData.location ? (
              <View style={styles.locationInfo}>
                <Text style={styles.locationText}>
                  📍 {formData.location.address}
                </Text>
                <Text style={styles.locationCoords}>
                  {formData.location.lat.toFixed(4)}, {formData.location.lng.toFixed(4)}
                </Text>
                <TouchableOpacity
                  style={[styles.locationButton, { marginTop: 12 }]}
                  onPress={() => setFormData(prev => ({ ...prev, location: null }))}
                >
                  <Text style={styles.locationButtonText}>Change Location</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <TextInput
                  style={styles.input}
                  value={manualAddress}
                  onChangeText={setManualAddress}
                  placeholder="Address (street, area)"
                />
                <TextInput
                  style={[styles.input, { marginTop: 8 }]}
                  value={manualCity}
                  onChangeText={setManualCity}
                  placeholder="City"
                />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
                  <TouchableOpacity
                    style={[styles.locationButton, { flex: 1, marginRight: 6 }]}
                    onPress={getCurrentLocation}
                  >
                    <Text style={styles.locationButtonText}>Use Current Location</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.locationButton, { flex: 1, marginLeft: 6 }]}
                    onPress={geocodeAddress}
                    disabled={isGeocoding}
                  >
                    <Text style={styles.locationButtonText}>{isGeocoding ? 'Locating…' : 'Use Entered Address'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            <Text style={styles.submitButtonText}>
              {isLoading ? 'Creating Donation...' : 'Create Donation'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
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
  form: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  picker: {
    height: 50,
  },
  locationSection: {
    marginTop: 16,
  },
  locationInfo: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
  },
  locationText: {
    fontSize: 16,
    color: '#374151',
  },
  locationCoords: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  locationButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#22c55e',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  locationButtonText: {
    color: '#22c55e',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#22c55e',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Photo upload styles
  photoButton: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    marginBottom: 16,
  },
  photoContainer: {
    padding: 16,
    alignItems: 'center',
  },
  photoPreview: {
    width: 120,
    height: 90,
    borderRadius: 8,
    marginBottom: 8,
  },
  photoText: {
    fontSize: 14,
    color: '#22c55e',
  },
  photoPlaceholder: {
    padding: 20,
    alignItems: 'center',
  },
  photoPlaceholderText: {
    fontSize: 32,
    marginBottom: 8,
  },
  photoPlaceholderLabel: {
    fontSize: 16,
    color: '#6b7280',
  },
});

export default DonateScreen;
