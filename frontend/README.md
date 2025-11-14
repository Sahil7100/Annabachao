# AnnaBachao Frontend

React Native mobile application for the AnnaBachao food waste management platform.

## Features

- ✅ User Authentication (Login/Register)
- ✅ Role-based Access Control (User, NGO, Admin)
- ✅ Food Donation Creation
- ✅ Interactive Map View
- ✅ NGO Listing and Management
- ✅ Profile Management
- ✅ Real-time Location Services
- ✅ Modern UI with Tailwind CSS styling

## Tech Stack

- **React Native** with Expo
- **React Navigation** for navigation
- **React Native Maps** for map functionality
- **Axios** for API communication
- **AsyncStorage** for local data storage
- **Expo Location** for GPS services
- **NativeWind** for Tailwind CSS styling

## Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   └── navigation/      # Navigation components
│   ├── context/            # React Context providers
│   ├── navigation/         # Navigation configuration
│   ├── screens/            # Screen components
│   │   ├── auth/          # Authentication screens
│   │   ├── main/          # Main app screens
│   │   └── common/        # Common screens
│   ├── services/          # API services
│   └── utils/             # Utility functions
├── App.js                 # Main app component
├── app.json              # Expo configuration
├── package.json          # Dependencies
└── tailwind.config.js    # Tailwind configuration
```

## Installation

1. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm start
   ```

3. **Run on specific platforms:**
   ```bash
   npm run android    # Android
   npm run ios        # iOS
   npm run web        # Web
   ```

## Configuration

### Backend Connection

Update the API base URL in `src/services/api.js`:

```javascript
const BASE_URL = 'http://your-backend-url:5000/api';
```

### Environment Variables

Create a `.env` file in the frontend root:

```env
EXPO_PUBLIC_API_URL=http://localhost:5000/api
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key
```

## Screen Structure

### Authentication Screens
- **LoginScreen**: User login with email/password
- **RegisterScreen**: User registration with role selection

### Main Screens
- **DashboardScreen**: Overview with stats and quick actions
- **DonateScreen**: Create food donations
- **MapViewScreen**: Interactive map with donation markers
- **NGOListScreen**: Browse available NGOs
- **ProfileScreen**: User profile and settings

### Navigation
- **Bottom Tab Navigation** for main screens
- **Stack Navigation** for auth flow
- **Role-based** navigation (different tabs for different user types)

## Key Features

### 1. Authentication System
- JWT token-based authentication
- Automatic token refresh
- Secure token storage with AsyncStorage
- Role-based access control

### 2. Donation Management
- Create donations with location data
- Automatic NGO assignment
- Real-time status updates
- Photo upload capability

### 3. Map Integration
- Real-time location services
- Interactive map with donation markers
- Distance-based filtering
- User location tracking

### 4. Modern UI/UX
- Tailwind CSS styling with NativeWind
- Consistent design system
- Responsive layouts
- Loading states and error handling

## API Integration

### Authentication APIs
```javascript
import { authAPI } from '../services/api';

// Login
const response = await authAPI.login(email, password);

// Register
const response = await authAPI.register(userData);

// Get Profile
const response = await authAPI.getProfile();
```

### Donation APIs
```javascript
import { donationAPI } from '../services/api';

// Create donation
const response = await donationAPI.createDonation(donationData);

// Get available donations
const response = await donationAPI.getAvailableDonations(params);
```

### Admin APIs
```javascript
import { adminAPI } from '../services/api';

// Get dashboard stats
const response = await adminAPI.getDashboardStats();

// Batch assign donations
const response = await adminAPI.batchAssignDonations(donationIds);
```

## State Management

### Authentication Context
- User authentication state
- Login/logout functionality
- Token management
- Role-based permissions

### Local Storage
- Authentication tokens
- User profile data
- App preferences
- Offline data caching

## Permissions Required

### iOS (Info.plist)
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>This app needs location access to show nearby donations</string>
<key>NSCameraUsageDescription</key>
<string>This app needs camera access to take photos of donations</string>
```

### Android (app.json)
```json
{
  "android": {
    "permissions": [
      "ACCESS_FINE_LOCATION",
      "ACCESS_COARSE_LOCATION",
      "CAMERA",
      "READ_EXTERNAL_STORAGE"
    ]
  }
}
```

## Development

### Code Style
- ESLint configuration for code quality
- Prettier for code formatting
- Consistent naming conventions
- Component-based architecture

### Testing
- Jest for unit testing
- React Native Testing Library for component testing
- Integration testing for API calls

### Build & Deployment

1. **Development Build:**
   ```bash
   expo start
   ```

2. **Production Build:**
   ```bash
   expo build:android
   expo build:ios
   ```

3. **Web Deployment:**
   ```bash
   expo build:web
   ```

## Troubleshooting

### Common Issues

1. **Metro bundler issues:**
   ```bash
   npx expo start --clear
   ```

2. **Package conflicts:**
   ```bash
   rm -rf node_modules
   npm install
   ```

3. **iOS simulator issues:**
   ```bash
   npx expo run:ios --device
   ```

### Debug Mode
- Enable debug mode in Expo Go app
- Use React Native Debugger for advanced debugging
- Console logs available in Expo development tools

## Future Enhancements

- [ ] Push notifications
- [ ] Offline mode support
- [ ] Advanced filtering and search
- [ ] Social sharing features
- [ ] Multi-language support
- [ ] Dark mode theme
- [ ] Advanced analytics
- [ ] In-app messaging
- [ ] Payment integration
- [ ] QR code scanning

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
