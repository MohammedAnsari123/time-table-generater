const mongoose = require('mongoose');

const SubjectSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true
  },
  code: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ["Theory", "Lab"],
    required: true
  },
  periods_per_week: {
    type: Number,
    required: true
  },
  assigned_lecturer_id: {
    type: String,
    default: null
  },
  semester: {
    type: Number,
    default: 1
  },
  department: {
    type: String,
    default: ""
  },
  credits: {
    type: Number,
    default: 3
  },
  lab_requirement: {
    type: Boolean,
    default: false
  }
}, {
  versionKey: false
});

module.exports = mongoose.model('Subject', SubjectSchema, 'subjects');
