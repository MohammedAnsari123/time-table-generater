const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  hashed_password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    default: 'user'
  }
}, {
  versionKey: false
});

module.exports = mongoose.model('User', UserSchema, 'users');
