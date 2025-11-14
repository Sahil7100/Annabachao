import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useAuth } from '../../context/AuthContext';

const WebViewDashboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [webViewUrl, setWebViewUrl] = useState('');

  // Generate admin dashboard URL with authentication
  const generateDashboardUrl = () => {
    const baseUrl = process.env.EXPO_PUBLIC_WEB_DASHBOARD_URL || 'http://localhost:3000';
    const token = user?.token || 'admin-token'; // In real app, get from secure storage
    return `${baseUrl}/admin?token=${token}&mobile=true`;
  };

  const handleWebViewLoad = () => {
    setIsLoading(false);
  };

  const handleWebViewError = () => {
    setIsLoading(false);
    Alert.alert(
      'Connection Error',
      'Unable to load the web dashboard. Please check your internet connection.',
      [
        { text: 'Retry', onPress: () => setWebViewUrl(generateDashboardUrl()) },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      switch (data.type) {
        case 'navigation':
          // Handle navigation requests from web dashboard
          if (data.screen) {
            navigation.navigate(data.screen, data.params);
          }
          break;
        case 'logout':
          // Handle logout request from web dashboard
          navigation.navigate('Login');
          break;
        case 'error':
          Alert.alert('Dashboard Error', data.message);
          break;
        default:
          console.log('WebView message:', data);
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  };

  const refreshDashboard = () => {
    setIsLoading(true);
    setWebViewUrl(generateDashboardUrl());
  };

  const openInBrowser = () => {
    const url = generateDashboardUrl();
    // In a real app, you would use Linking.openURL(url)
    Alert.alert(
      'Open in Browser',
      `Would you like to open the dashboard in your browser?\n\n${url}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open', onPress: () => console.log('Opening:', url) },
      ]
    );
  };

  // Initialize URL when component mounts
  React.useEffect(() => {
    if (!webViewUrl) {
      setWebViewUrl(generateDashboardUrl());
    }
  }, []);

  return (
    <View style={styles.container}>
      {/* Header with controls */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.headerButtonText}>← Back</Text>
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Web Dashboard</Text>
        
        <TouchableOpacity
          style={styles.headerButton}
          onPress={refreshDashboard}
        >
          <Text style={styles.headerButtonText}>🔄</Text>
        </TouchableOpacity>
      </View>

      {/* Loading indicator */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ef4444" />
          <Text style={styles.loadingText}>Loading Dashboard...</Text>
        </View>
      )}

      {/* WebView */}
      {webViewUrl ? (
        <WebView
          source={{ uri: webViewUrl }}
          style={styles.webView}
          onLoad={handleWebViewLoad}
          onError={handleWebViewError}
          onMessage={handleMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          scalesPageToFit={true}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          mixedContentMode="compatibility"
          userAgent="AnnaBachao-Mobile-Admin"
          // Security settings
          originWhitelist={['*']}
          allowsBackForwardNavigationGestures={false}
          // Custom headers for authentication
          onShouldStartLoadWithRequest={(request) => {
            // Allow navigation within the dashboard domain
            const dashboardDomain = process.env.EXPO_PUBLIC_WEB_DASHBOARD_URL || 'localhost:3000';
            return request.url.includes(dashboardDomain);
          }}
        />
      ) : (
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Dashboard Unavailable</Text>
          <Text style={styles.errorText}>
            Unable to generate dashboard URL. Please check your configuration.
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={refreshDashboard}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Footer with additional options */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.footerButton} onPress={refreshDashboard}>
          <Text style={styles.footerButtonText}>🔄 Refresh</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.footerButton} onPress={openInBrowser}>
          <Text style={styles.footerButtonText}>🌐 Open in Browser</Text>
        </TouchableOpacity>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50,
  },
  headerButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  webView: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#f9fafb',
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#ef4444',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  footerButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 6,
    paddingVertical: 8,
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  footerButtonText: {
    color: '#374151',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default WebViewDashboardScreen;









