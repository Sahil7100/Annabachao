# TestSprite MCP Configuration for AnnaBachao Frontend

## Project Overview
- **Project Name**: AnnaBachao Food Waste Management App
- **Type**: React Native (Expo)
- **Testing Focus**: Frontend UI/UX Testing

## Application URLs
- **Local Development**: http://localhost:19006 (Expo web)
- **Mobile Simulator**: exp://192.168.1.100:19000
- **Backend API**: http://localhost:3000

## Test Account Credentials

### Regular User
- Email: testuser@example.com
- Password: testpassword123
- Role: user

### NGO User  
- Email: testngo@example.com
- Password: testpassword123
- Role: ngo

### Admin User
- Email: admin@example.com
- Password: adminpassword123
- Role: admin

## Key Features to Test

### 1. Authentication Flow
- Login screen functionality
- Registration process
- Logout functionality
- Authentication state management

### 2. Donation Management
- Donation form submission
- Donation type selection (food, clothing, etc.)
- Location and description input
- Photo upload functionality
- Success screen navigation

### 3. User Role-Based Features
- Regular user dashboard
- NGO dashboard and donation management
- Admin panel and user management
- Role-specific navigation

### 4. Navigation & UI
- Tab navigation between screens
- Screen transitions and animations
- Form validation and error handling
- Loading states and feedback

### 5. Map Integration
- Location services
- Map view functionality
- NGO location display
- Distance calculations

## Test Scenarios Priority

### High Priority
1. User registration and login
2. Donation creation flow
3. NGO donation management
4. Admin user management

### Medium Priority
1. Profile management
2. Map view functionality
3. Notification handling
4. Offline functionality

### Low Priority
1. Settings and preferences
2. Help and support
3. Analytics and reporting

## Expected Behavior

### Login Screen
- Should display email and password fields
- Should validate input format
- Should show loading state during authentication
- Should navigate to appropriate dashboard based on user role

### Donation Form
- Should allow selection of donation type
- Should require quantity and description
- Should validate location input
- Should allow photo upload
- Should show success message after submission

### NGO Dashboard
- Should display available donations
- Should allow claiming donations
- Should show donation history
- Should allow proof upload

### Admin Panel
- Should display user statistics
- Should allow user management
- Should show system analytics
- Should provide web dashboard access

## Test Data Requirements

### Sample Donations
```json
{
  "type": "food",
  "quantity": 5,
  "description": "Fresh vegetables from local market",
  "location": "Downtown Area",
  "expiryDate": "2024-12-31",
  "images": ["donation1.jpg", "donation2.jpg"]
}
```

### Sample Users
```json
{
  "name": "Test User",
  "email": "testuser@example.com",
  "phone": "+1234567890",
  "role": "user",
  "location": "Test City"
}
```

## Performance Expectations
- App should load within 3 seconds
- Navigation should be smooth (< 500ms transitions)
- Forms should respond within 200ms
- Images should load within 2 seconds

## Accessibility Requirements
- WCAG 2.1 AA compliance
- Screen reader compatibility
- Keyboard navigation support
- High contrast mode support
- Font size scaling support
