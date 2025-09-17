const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Role name is required'],
    unique: true,
    trim: true,
    uppercase: true,
    minlength: [2, 'Role name must be at least 2 characters long'],
    maxlength: [50, 'Role name cannot exceed 50 characters'],
    match: [/^[A-Z_]+$/, 'Role name can only contain uppercase letters and underscores']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters'],
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
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

// Indexes for performance (name index is automatically created by unique: true)
roleSchema.index({ isActive: 1 });

// Pre-save middleware to update the updatedAt field
roleSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.updatedAt = Date.now();
  }
  next();
});

// Pre-update middleware to update the updatedAt field
roleSchema.pre(['updateOne', 'findOneAndUpdate'], function(next) {
  this.set({ updatedAt: Date.now() });
  next();
});

// Instance method to get public profile
roleSchema.methods.getPublicProfile = function() {
  return {
    id: this._id,
    name: this.name,
    description: this.description,
    isActive: this.isActive,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

// Static method to find active roles
roleSchema.statics.findActiveRoles = function() {
  return this.find({ isActive: true }).sort({ name: 1 });
};

// Static method to initialize default roles
roleSchema.statics.initializeDefaultRoles = async function() {
  const defaultRoles = [
    { name: 'ADMIN', description: 'System administrator with full access' },
    { name: 'USER', description: 'Regular user with basic access' },
    { name: 'MODERATOR', description: 'Content moderator with limited admin access' },
    { name: 'DEVELOPER', description: 'Software developer with technical access' },
    { name: 'MANAGER', description: 'Team manager with management access' }
  ];

  try {
    for (const roleData of defaultRoles) {
      await this.findOneAndUpdate(
        { name: roleData.name },
        roleData,
        { upsert: true, new: true }
      );
    }
    console.log('Default roles initialized successfully');
  } catch (error) {
    console.error('Error initializing default roles:', error);
  }
};

module.exports = mongoose.model('Role', roleSchema);
