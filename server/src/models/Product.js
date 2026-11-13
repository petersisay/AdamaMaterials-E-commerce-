const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [1, 'Price must be at least 1 ETB'],
      validate: {
        validator: function (val) {
          return !isNaN(val) && isFinite(val) && val >= 1;
        },
        message: 'Product price must be a valid positive amount in ETB',
      },
    },
    quantity: {
      type: Number,
      required: [true, 'Product quantity is required'],
      min: [0, 'Quantity cannot be negative'],
      validate: {
        validator: function (val) {
          return !isNaN(val) && isFinite(val) && Number.isInteger(val) && val >= 0;
        },
        message: 'Quantity must be a non-negative integer',
      },
      default: 1,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Product category is required'],
    },
    materialType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MaterialType',
      required: [true, 'Material type is required'],
    },
    condition: {
      type: String,
      enum: ['New', 'Like New', 'Good', 'Fair', 'Used', 'Salvaged'],
      required: [true, 'Product condition is required'],
      default: 'Good',
    },
    images: {
      type: [String],
      validate: [
        {
          validator: function (val) {
            return val.length > 0;
          },
          message: 'At least one product image is required',
        },
      ],
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    approvalStatus: {
      type: String,
      enum: ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'SUSPENDED'],
      default: 'DRAFT',
    },
    rejectionReason: {
      type: String,
      default: '',
    },
    location: {
      subCity: {
        type: String,
        required: true,
        default: 'Adama Kebele 04',
      },
      city: {
        type: String,
        required: true,
        default: 'Adama',
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for searching and filtering
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ approvalStatus: 1, category: 1, materialType: 1, price: 1 });

module.exports = mongoose.model('Product', productSchema);
