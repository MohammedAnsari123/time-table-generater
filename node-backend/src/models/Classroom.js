const mongoose = require('mongoose');

const ClassroomSchema = new mongoose.Schema({
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
    default: ""
  },
  capacity: {
    type: Number,
    required: true
  },
  building: {
    type: String,
    default: ""
  },
  floor: {
    type: Number,
    default: 0
  },
  type: {
    type: String,
    enum: ["Classroom", "Lab"],
    default: "Classroom"
  },
  status: {
    type: String,
    enum: ["Available", "Unavailable"],
    default: "Available"
  }
}, {
  versionKey: false
});

module.exports = mongoose.model('Classroom', ClassroomSchema, 'classrooms');
