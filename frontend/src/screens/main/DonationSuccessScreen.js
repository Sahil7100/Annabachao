import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
} from 'react-native';

const DonationSuccessScreen = ({ route, navigation }) => {
  const { donation, assignedNGO } = route.params;

  const openMapRoute = () => {
    // Open Google Maps with route to NGO location
    const destination = `${assignedNGO.location?.lat},${assignedNGO.location?.lng}`;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
    
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Cannot open maps app');
      }
    });
  };

  const contactNGO = () => {
    // Open email or phone app to contact NGO
    const emailUrl = `mailto:${assignedNGO.email}?subject=Food Donation Pickup&body=Hello, I have a food donation ready for pickup. Donation ID: ${donation._id}`;
    
    Linking.canOpenURL(emailUrl).then(supported => {
      if (supported) {
        Linking.openURL(emailUrl);
      }
    });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.successIcon}>✅</Text>
        <Text style={styles.title}>Donation Created Successfully!</Text>
        <Text style={styles.subtitle}>Thank you for helping reduce food waste</Text>
      </View>

      <View style={styles.content}>
        {/* Donation Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Donation Details</Text>
          <View style={styles.detailCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Food Item:</Text>
              <Text style={styles.detailValue}>{donation.foodItem}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Quantity:</Text>
              <Text style={styles.detailValue}>
                {donation.quantity} {donation.quantityUnit}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Status:</Text>
              <Text style={[styles.detailValue, styles.statusAssigned]}>
                {donation.status}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Donation ID:</Text>
              <Text style={styles.detailValue}>{donation._id}</Text>
            </View>
          </View>
        </View>

        {/* Assigned NGO */}
        {assignedNGO && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Assigned NGO</Text>
            <View style={styles.ngoCard}>
              <Text style={styles.ngoName}>{assignedNGO.name}</Text>
              <Text style={styles.ngoEmail}>{assignedNGO.email}</Text>
              
              {assignedNGO.location && (
                <View style={styles.locationInfo}>
                  <Text style={styles.locationLabel}>📍 Location:</Text>
                  <Text style={styles.locationText}>
                    {assignedNGO.location.address}
                  </Text>
                </View>
              )}

              <View style={styles.ngoActions}>
                <TouchableOpacity
                  style={styles.contactButton}
                  onPress={contactNGO}
                >
                  <Text style={styles.contactButtonText}>📞 Contact NGO</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.mapButton}
                  onPress={openMapRoute}
                >
                  <Text style={styles.mapButtonText}>🗺️ Get Directions</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Next Steps */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What's Next?</Text>
          <View style={styles.stepsCard}>
            <View style={styles.step}>
              <Text style={styles.stepNumber}>1</Text>
              <Text style={styles.stepText}>
                The assigned NGO will contact you soon to arrange pickup
              </Text>
            </View>
            <View style={styles.step}>
              <Text style={styles.stepNumber}>2</Text>
              <Text style={styles.stepText}>
                Keep the food fresh and ready for collection
              </Text>
            </View>
            <View style={styles.step}>
              <Text style={styles.stepNumber}>3</Text>
              <Text style={styles.stepText}>
                You'll receive updates on the donation status
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('Dashboard')}
          >
            <Text style={styles.primaryButtonText}>Back to Dashboard</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Donate')}
          >
            <Text style={styles.secondaryButtonText}>Donate More Food</Text>
          </TouchableOpacity>
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
  header: {
    backgroundColor: '#22c55e',
    padding: 40,
    paddingTop: 80,
    alignItems: 'center',
  },
  successIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.9,
    textAlign: 'center',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 12,
  },
  detailCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  statusAssigned: {
    color: '#22c55e',
    fontWeight: 'bold',
  },
  ngoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ngoName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
  },
  ngoEmail: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 16,
  },
  locationInfo: {
    marginBottom: 20,
  },
  locationLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  locationText: {
    fontSize: 16,
    color: '#374151',
  },
  ngoActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  contactButton: {
    backgroundColor: '#22c55e',
    borderRadius: 8,
    padding: 12,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  contactButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  mapButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    padding: 12,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  mapButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  stepsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#22c55e',
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 24,
    marginRight: 12,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  actions: {
    marginTop: 20,
    marginBottom: 40,
  },
  primaryButton: {
    backgroundColor: '#22c55e',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  secondaryButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DonationSuccessScreen;

