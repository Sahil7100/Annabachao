# TestSprite Testing Setup for AnnaBachao App

This directory contains TestSprite testing configuration and test suites for the AnnaBachao React Native application.

## Overview

TestSprite is an AI-driven testing platform that automates test generation and execution for React Native applications. This setup includes comprehensive test coverage for all major app features.

## Files

- `testsprite.config.js` - Main TestSprite configuration file
- `tests/testsprite.test.js` - Test suite implementations
- `run-testsprite.js` - Test runner script
- `.env.example` - Environment variables template

## Test Coverage

### 1. Authentication Flow
- User login functionality
- User registration
- Logout process
- Authentication state management

### 2. Donation Flow
- Donation form submission
- Donation type selection
- Location and description input
- Success screen navigation

### 3. NGO Dashboard
- NGO user login
- Available donations view
- Donation management
- NGO-specific features

### 4. Admin Panel
- Admin user login
- User management
- System statistics
- Admin-specific features

### 5. Navigation Flow
- Tab navigation
- Screen transitions
- Deep linking
- Back navigation

### 6. API Integration
- Authentication endpoints
- Donation CRUD operations
- User management APIs
- Error handling

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install dotenv
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your TestSprite API key and test data
   ```

3. **Get TestSprite API Key**
   - Visit [testsprite.com](https://testsprite.com)
   - Sign up for an account
   - Get your API key from the dashboard
   - Add it to your `.env` file

## Running Tests

### Run All Tests
```bash
npm run test:all
```

### Run Individual Test Suites
```bash
# Authentication tests
npm run test:auth

# Donation flow tests
npm run test:donation

# NGO dashboard tests
npm run test:ngo

# Admin panel tests
npm run test:admin
```

### Run with Custom Script
```bash
node run-testsprite.js
```

## Test Configuration

The `testsprite.config.js` file contains:

- **Project Information**: Name, type, version
- **Entry Points**: Main app components to test
- **Screen Components**: All screens in the app
- **API Endpoints**: Backend API endpoints
- **Test Scenarios**: Detailed test cases
- **User Roles**: Test user credentials
- **Environment**: Platform and device settings
- **Test Data**: Sample data for testing

## Test Results

Test results are saved to:
- `test-results/testsprite-report.json` - Detailed JSON report
- Console output with pass/fail summary
- Screenshots (if enabled)
- Performance metrics

## Customization

### Adding New Tests
1. Add test case to `testsprite.config.js`
2. Implement test function in `tests/testsprite.test.js`
3. Add npm script to `package.json`

### Modifying Test Data
Update the `testData` section in `testsprite.config.js` with your specific test data.

### Environment Variables
Configure test environment in `.env` file:
- API endpoints
- Test user credentials
- Timeout settings
- Feature flags

## Troubleshooting

### Common Issues

1. **API Key Not Set**
   - Ensure TESTSPRITE_API_KEY is set in .env file
   - Verify API key is valid on TestSprite dashboard

2. **Backend Not Running**
   - Start the backend server on localhost:3000
   - Verify API endpoints are accessible

3. **Test Timeouts**
   - Increase TEST_TIMEOUT in .env file
   - Check network connectivity

4. **Authentication Failures**
   - Verify test user credentials
   - Check backend authentication setup

### Debug Mode
Enable debug logging by setting:
```bash
DEBUG=testsprite:*
```

## Integration with CI/CD

Add TestSprite tests to your CI/CD pipeline:

```yaml
# GitHub Actions example
- name: Run TestSprite Tests
  run: |
    npm install
    npm run test:all
  env:
    TESTSPRITE_API_KEY: ${{ secrets.TESTSPRITE_API_KEY }}
```

## Best Practices

1. **Test Data Management**
   - Use separate test data for each environment
   - Clean up test data after test runs
   - Use realistic test scenarios

2. **Test Organization**
   - Group related tests together
   - Use descriptive test names
   - Keep tests independent

3. **Performance Testing**
   - Monitor test execution time
   - Set appropriate timeouts
   - Use performance thresholds

4. **Maintenance**
   - Update tests when UI changes
   - Review test results regularly
   - Remove obsolete tests

## Support

- TestSprite Documentation: [docs.testsprite.com](https://docs.testsprite.com)
- TestSprite Community: [GitHub](https://github.com/TestSprite/Docs)
- AnnaBachao Project: Check project README for app-specific issues
