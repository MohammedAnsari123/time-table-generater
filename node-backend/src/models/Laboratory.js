const mongoose = require('mongoose');

const LaboratorySchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true
  },
  id: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  capacity: {
    type: Number,
    required: true
  },
  department: {
    type: String,
    required: true
  },
  supported_subjects: [{
    type: String
  }],
  available_days: {
    type: [String],
    default: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
  },
  status: {
    type: String,
    enum: ["Available", "Unavailable"],
    default: "Available"
  }
}, {
  versionKey: false
});

module.exports = mongoose.model('Laboratory', LaboratorySchema, 'labs');
