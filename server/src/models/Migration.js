const mongoose = require('mongoose');

const migrationSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    appliedAt: {
      type: Date,
      default: Date.now,
    },
    details: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Migration', migrationSchema);
