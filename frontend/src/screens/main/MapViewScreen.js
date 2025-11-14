import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
} from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import { donationAPI } from '../../services/api';

const MapViewScreen = () => {
  const [region, setRegion] = useState(null);
  const [donations, setDonations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const mapRef = useRef(null);
  const lastTapRef = useRef(0);
  const locationSubRef = useRef(null);
  const userInteractingRef = useRef(false);
  const interactionTimeoutRef = useRef(null);
  const lastFixRef = useRef(null);

  useEffect(() => {
    initializeMap();
    return () => {
      if (locationSubRef.current) {
        try { locationSubRef.current.remove(); } catch (_) {}
        locationSubRef.current = null;
      }
    };
  }, []);

  const initializeMap = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const startRegion = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.03,
          longitudeDelta: 0.03,
        };
        setRegion(startRegion);
        requestAnimationFrame(() => {
          if (mapRef.current) mapRef.current.animateToRegion(startRegion, 500);
        });

        // Lightweight watcher: update on >=40m movement; ignore <~15m jitter; smooth updates
        locationSubRef.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 5000,
            distanceInterval: 40,
          },
          (pos) => {
            if (userInteractingRef.current) return; // don't fight user gestures

            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;

            const distanceMeters = (a, b) => {
              if (!a || !b) return Infinity;
              const toRad = (x) => (x * Math.PI) / 180;
              const R = 6371000;
              const dLat = toRad(b.latitude - a.latitude);
              const dLng = toRad(b.longitude - a.longitude);
              const la1 = toRad(a.latitude);
              const la2 = toRad(b.latitude);
              const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
              return 2 * R * Math.asin(Math.sqrt(h));
            };

            const currentCenter = region ? { latitude: region.latitude, longitude: region.longitude } : null;
            const nextCenter = { latitude: lat, longitude: lng };
            const dist = distanceMeters(currentCenter, nextCenter);
            if (dist < 15) return; // ignore jitter under ~15m

            // Low-pass filter: blend old and new center to reduce jumpiness
            const alpha = 0.3; // 30% new, 70% old
            const blended = currentCenter
              ? {
                  latitude: currentCenter.latitude * (1 - alpha) + nextCenter.latitude * alpha,
                  longitude: currentCenter.longitude * (1 - alpha) + nextCenter.longitude * alpha,
                }
              : nextCenter;

            setRegion((prev) => ({
              latitude: blended.latitude,
              longitude: blended.longitude,
              latitudeDelta: prev?.latitudeDelta ?? 0.02,
              longitudeDelta: prev?.longitudeDelta ?? 0.02,
            }));

            lastFixRef.current = nextCenter;
          }
        );
      }
      loadDonations();
    } catch (error) {
      console.error('Error initializing map:', error);
      Alert.alert('Error', 'Failed to initialize map');
    }
  };

  const loadDonations = async () => {
    try {
      if (!region || region.latitude == null || region.longitude == null) {
        return; // wait until region is initialized
      }
      const response = await donationAPI.getAvailableDonations({
        lat: region.latitude,
        lng: region.longitude,
        maxDistance: 20,
        page: 1,
        limit: 100,
      });
      setDonations(response.data.donations);
    } catch (error) {
      console.error('Error loading donations:', error);
      Alert.alert('Error', 'Failed to load donations');
    } finally {
      setIsLoading(false);
    }
  };

  // Debounce region change to avoid request loops
  const regionChangeTimeoutRef = useRef(null);
  const onRegionChangeComplete = (newRegion) => {
    setRegion(newRegion);
    if (regionChangeTimeoutRef.current) clearTimeout(regionChangeTimeoutRef.current);
    regionChangeTimeoutRef.current = setTimeout(() => {
      loadDonations();
    }, 600);
  };

  const handleMapPress = (e) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      const coord = e.nativeEvent.coordinate;
      const current = region || { latitude: coord.latitude, longitude: coord.longitude, latitudeDelta: 0.03, longitudeDelta: 0.03 };
      const zoomed = {
        latitude: coord.latitude,
        longitude: coord.longitude,
        latitudeDelta: Math.max(current.latitudeDelta * 0.5, 0.002),
        longitudeDelta: Math.max(current.longitudeDelta * 0.5, 0.002),
      };
      if (mapRef.current) mapRef.current.animateToRegion(zoomed, 200);
      setRegion(zoomed);
    }
    lastTapRef.current = now;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Food Donations Map</Text>
        <Text style={styles.subtitle}>Find nearby donations</Text>
      </View>

      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={region || { latitude: 28.6139, longitude: 77.2090, latitudeDelta: 0.0922, longitudeDelta: 0.0421 }}
        region={region || undefined}
        onRegionChangeComplete={onRegionChangeComplete}
        showsUserLocation
        showsMyLocationButton
        onPress={handleMapPress}
      >
        {donations.map((donation, index) => (
          <Marker
            key={index}
            coordinate={{
              latitude: donation.location.lat,
              longitude: donation.location.lng,
            }}
            title={donation.foodItem}
            description={`${donation.quantity} ${donation.quantityUnit} - ${donation.status}`}
          >
            <Callout>
              <View style={styles.callout}>
                <Text style={styles.calloutTitle}>{donation.foodItem}</Text>
                <Text style={styles.calloutQuantity}>
                  {donation.quantity} {donation.quantityUnit}
                </Text>
                <Text style={styles.calloutStatus}>
                  Status: {donation.status}
                </Text>
                {donation.description && (
                  <Text style={styles.calloutDescription}>
                    {donation.description}
                  </Text>
                )}
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Legend:</Text>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#22c55e' }]} />
          <Text style={styles.legendText}>Available Donations</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
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
  map: {
    flex: 1,
  },
  callout: {
    width: 200,
    padding: 10,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
  },
  calloutQuantity: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  calloutStatus: {
    fontSize: 12,
    color: '#22c55e',
    marginTop: 2,
  },
  calloutDescription: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  legend: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 10,
    borderRadius: 8,
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 5,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: '#6b7280',
  },
});

export default MapViewScreen;
