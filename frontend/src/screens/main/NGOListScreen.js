import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { userAPI } from '../../services/api';

const NGOListScreen = () => {
  const [ngos, setNGOs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadNGOs();
  }, []);

  const loadNGOs = async () => {
    try {
      setIsLoading(true);
      // Note: This endpoint might need to be implemented in the backend
      // For now, we'll create mock data
      const mockNGOs = [
        {
          id: '1',
          name: 'Food Bank Central',
          email: 'contact@foodbank.org',
          description: 'Serving the community since 2010',
          location: 'Central District',
          capacity: 100,
          workload: 25,
        },
        {
          id: '2',
          name: 'Community Kitchen North',
          email: 'info@communitykitchen.org',
          description: 'Fresh meals for everyone',
          location: 'North District',
          capacity: 50,
          workload: 15,
        },
        {
          id: '3',
          name: 'Hunger Relief South',
          email: 'help@hungerrelief.org',
          description: 'Fighting hunger, one meal at a time',
          location: 'South District',
          capacity: 80,
          workload: 30,
        },
      ];
      setNGOs(mockNGOs);
    } catch (error) {
      console.error('Error loading NGOs:', error);
      Alert.alert('Error', 'Failed to load NGOs');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNGOs();
    setRefreshing(false);
  };

  const renderNGOItem = ({ item }) => (
    <TouchableOpacity style={styles.ngoCard}>
      <View style={styles.ngoHeader}>
        <Text style={styles.ngoName}>{item.name}</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>Active</Text>
        </View>
      </View>
      
      <Text style={styles.ngoDescription}>{item.description}</Text>
      
      <View style={styles.ngoDetails}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Location:</Text>
          <Text style={styles.detailValue}>{item.location}</Text>
        </View>
        
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Capacity:</Text>
          <Text style={styles.detailValue}>{item.capacity}</Text>
        </View>
        
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Current Workload:</Text>
          <Text style={styles.detailValue}>{item.workload}</Text>
        </View>
      </View>

      <View style={styles.ngoActions}>
        <TouchableOpacity style={styles.contactButton}>
          <Text style={styles.contactButtonText}>Contact</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.viewButton}>
          <Text style={styles.viewButtonText}>View Details</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateText}>No NGOs found</Text>
      <Text style={styles.emptyStateSubtext}>
        Check back later for available NGOs in your area
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>NGO Partners</Text>
        <Text style={styles.subtitle}>Find organizations in your area</Text>
      </View>

      <FlatList
        data={ngos}
        renderItem={renderNGOItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </View>
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
    padding: 20,
  },
  ngoCard: {
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
  ngoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ngoName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    flex: 1,
  },
  statusBadge: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
  },
  ngoDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  ngoDetails: {
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
    width: 120,
  },
  detailValue: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  ngoActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  contactButton: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    flex: 1,
    marginRight: 8,
  },
  contactButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  viewButton: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    flex: 1,
    marginLeft: 8,
  },
  viewButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6b7280',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
});

export default NGOListScreen;
