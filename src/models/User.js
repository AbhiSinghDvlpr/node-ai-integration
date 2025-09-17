const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email address'
    ]
  },
  role: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role',
    required: [true, 'Role is required']
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE'],
    default: 'ACTIVE'
  },
  bio: {
    type: String,
    trim: true,
    maxlength: [1500, 'Bio cannot exceed 1500 characters'],
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true, 
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance (email index is automatically created by unique: true)
userSchema.index({ status: 1 });
userSchema.index({ createdAt: -1 });

// Virtual for user's full profile
userSchema.virtual('profile').get(function() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    status: this.status,
    bio: this.bio
  };
});

// Pre-save middleware to update the updatedAt field
userSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.updatedAt = Date.now();
  }
  next();
});

// Pre-update middleware to update the updatedAt field
userSchema.pre(['updateOne', 'findOneAndUpdate'], function(next) {
  this.set({ updatedAt: Date.now() });
  next();
});

// Instance method to get public profile
userSchema.methods.getPublicProfile = function() {
  return {
    id: this._id,
    name: this.name,
    role: this.role,
    email:this.email,
    status: this.status,
    bio: this.bio,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

// Static method to find active users
userSchema.statics.findActiveUsers = function() {
  return this.find({ status: 'ACTIVE' });
};

// Static method to search users by name or role
userSchema.statics.searchUsers = function(query) {
  return this.find({
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { role: { $regex: query, $options: 'i' } }
    ]
  });
};

module.exports = mongoose.model('User', userSchema);
