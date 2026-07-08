const mongoose = require('mongoose');

const StaffSchema = new mongoose.Schema({
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
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  department: {
    type: String,
    default: ""
  },
  designation: {
    type: String,
    default: ""
  },
  subjects: [{
    type: String
  }],
  max_periods_per_day: {
    type: Number,
    default: 4
  },
  max_periods_per_week: {
    type: Number,
    default: 20
  },
  available_days: {
    type: [String],
    default: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
  },
  preferred_slots: {
    type: [String],
    default: null
  },
  semesters: {
    type: [Number],
    default: [1, 2, 3, 4, 5, 6, 7, 8]
  },
  status: {
    type: String,
    enum: ["Active", "Inactive"],
    default: "Active"
  }
}, {
  versionKey: false
});

module.exports = mongoose.model('Staff', StaffSchema, 'staff');
