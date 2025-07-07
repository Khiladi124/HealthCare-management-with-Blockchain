import mongoose from 'mongoose';

const medicineSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Medicine name is required'],
    trim: true,
    maxlength: [100, 'Medicine name cannot exceed 100 characters']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0, 'Quantity cannot be negative'],
    validate: {
      validator: Number.isInteger,
      message: 'Quantity must be a whole number'
    }
  },
  minThreshold: {
    type: Number,
    required: [true, 'Minimum threshold is required'],
    min: [0, 'Minimum threshold cannot be negative'],
    default: 10,
    validate: {
      validator: Number.isInteger,
      message: 'Minimum threshold must be a whole number'
    }
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: {
      values: ['Antibiotics', 'Pain Relief', 'Antiseptic', 'Vitamins', 'First Aid', 'Prescription', 'Other'],
      message: 'Category must be one of: Antibiotics, Pain Relief, Antiseptic, Vitamins, First Aid, Prescription, Other'
    },
    default: 'Other'
  },
  expiryDate: {
    type: Date,
    validate: {
      validator: function(date) {
        return !date || date > new Date();
      },
      message: 'Expiry date must be in the future'
    }
  },
  addedDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      
      // Format dates for frontend
      if (ret.expiryDate) {
        ret.expiryDate = ret.expiryDate.toISOString().split('T')[0];
      }
      if (ret.addedDate) {
        ret.addedDate = ret.addedDate.toISOString().split('T')[0];
      }
      
      return ret;
    }
  }
});

// Indexes for better query performance
medicineSchema.index({ name: 1 });
medicineSchema.index({ category: 1 });
medicineSchema.index({ quantity: 1 });
medicineSchema.index({ expiryDate: 1 });

// Virtual for checking if medicine is low stock
medicineSchema.virtual('isLowStock').get(function() {
  return this.quantity <= this.minThreshold;
});

// Virtual for checking if medicine is expiring soon (within 30 days)
medicineSchema.virtual('isExpiringSoon').get(function() {
  if (!this.expiryDate) return false;
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  return this.expiryDate <= thirtyDaysFromNow;
});

// Static method to get medicines with low stock
medicineSchema.statics.findLowStock = function() {
  return this.find().where('quantity').lte(this.schema.paths.minThreshold);
};

// Static method to get medicines expiring soon
medicineSchema.statics.findExpiringSoon = function() {
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  return this.find({
    expiryDate: {
      $exists: true,
      $lte: thirtyDaysFromNow
    }
  });
};

// Pre-save middleware to validate expiry date
medicineSchema.pre('save', function(next) {
  if (this.expiryDate && this.expiryDate <= new Date()) {
    next(new Error('Expiry date must be in the future'));
  } else {
    next();
  }
});

const Medicine = mongoose.model('Medicine', medicineSchema);

export default Medicine;