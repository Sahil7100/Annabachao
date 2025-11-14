const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  donorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Donor ID is required']
  },
  ngoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Will be auto-assigned
  },
  foodItem: {
    type: String,
    required: [true, 'Food item is required'],
    trim: true,
    maxlength: [100, 'Food item name cannot exceed 100 characters']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1'],
    max: [1000, 'Quantity cannot exceed 1000']
  },
  quantityUnit: {
    type: String,
    enum: ['servings', 'plates', 'boxes', 'kg', 'pieces'],
    default: 'servings'
  },
  cookedTime: {
    type: Date,
    required: [true, 'Cooked time is required']
  },
  expiryTime: {
    type: Date,
    required: false
  },
  location: {
    lat: {
      type: Number,
      required: [true, 'Latitude is required'],
      min: [-90, 'Latitude must be between -90 and 90'],
      max: [90, 'Latitude must be between -90 and 90']
    },
    lng: {
      type: Number,
      required: [true, 'Longitude is required'],
      min: [-180, 'Longitude must be between -180 and 180'],
      max: [180, 'Longitude must be between -180 and 180']
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
      maxlength: [200, 'Address cannot exceed 200 characters']
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      maxlength: [50, 'City name cannot exceed 50 characters']
    }
  },
  status: {
    type: String,
    enum: ['pending', 'assigned', 'picked', 'delivered', 'expired', 'cancelled'],
    default: 'pending'
  },
  photoURL: {
    type: String,
    validate: {
      validator: function(v) {
        if (!v) return true; // Optional field
        return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v);
      },
      message: 'Photo URL must be a valid image URL'
    }
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  pickupInstructions: {
    type: String,
    trim: true,
    maxlength: [300, 'Pickup instructions cannot exceed 300 characters']
  },
  assignedAt: {
    type: Date
  },
  pickedAt: {
    type: Date
  },
  deliveredAt: {
    type: Date
  },
  notes: [{
    text: {
      type: String,
      required: true,
      trim: true
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Index for efficient queries
donationSchema.index({ donorId: 1, createdAt: -1 });
donationSchema.index({ ngoId: 1, status: 1 });
donationSchema.index({ status: 1, createdAt: -1 });
donationSchema.index({ 'location.lat': 1, 'location.lng': 1 });

// Virtual for calculating freshness
donationSchema.virtual('isFresh').get(function() {
  const now = new Date();
  const timeDiff = now - this.cookedTime;
  const hoursDiff = timeDiff / (1000 * 60 * 60);
  
  // Consider fresh if cooked within last 4 hours
  return hoursDiff <= 4;
});

// Virtual for calculating time until expiry
donationSchema.virtual('timeUntilExpiry').get(function() {
  const now = new Date();
  const timeDiff = this.expiryTime - now;
  return Math.max(0, Math.floor(timeDiff / (1000 * 60 * 60))); // Hours until expiry
});

// Pre-save middleware to set expiry time if not provided
donationSchema.pre('save', function(next) {
  if (!this.expiryTime && this.cookedTime) {
    // Default expiry: 6 hours after cooking
    this.expiryTime = new Date(this.cookedTime.getTime() + (6 * 60 * 60 * 1000));
  }
  next();
});

// Method to check if donation is still valid
donationSchema.methods.isValid = function() {
  const now = new Date();
  return this.expiryTime > now && this.status !== 'expired' && this.status !== 'cancelled';
};

// Method to calculate distance from a point
donationSchema.methods.distanceFrom = function(lat, lng) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat - this.location.lat) * Math.PI / 180;
  const dLng = (lng - this.location.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(this.location.lat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
};

// Static method to find nearby donations
donationSchema.statics.findNearby = function(lat, lng, maxDistance = 10) {
  return this.find({
    'location.lat': {
      $gte: lat - (maxDistance / 111), // Rough conversion: 1 degree ≈ 111 km
      $lte: lat + (maxDistance / 111)
    },
    'location.lng': {
      $gte: lng - (maxDistance / (111 * Math.cos(lat * Math.PI / 180))),
      $lte: lng + (maxDistance / (111 * Math.cos(lat * Math.PI / 180)))
    }
  });
};

module.exports = mongoose.model('Donation', donationSchema);
