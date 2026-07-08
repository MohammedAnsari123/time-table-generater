const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.register = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ detail: "Email and password are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ detail: "Email already registered" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      email,
      hashed_password: hashedPassword,
      role: 'user'
    });

    await newUser.save();
    return res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({ detail: "Server error during registration" });
  }
};

exports.login = async (req, res) => {
  try {
    // Frontend sends FormData with 'username' and 'password'
    // Form fields might be in req.body because of multer.none() or other parser
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ detail: "Username (email) and password are required" });
    }

    const user = await User.findOne({ email: username });
    if (!user) {
      return res.status(401).json({ detail: "Incorrect username or password" });
    }

    const isMatch = await bcrypt.compare(password, user.hashed_password);
    if (!isMatch) {
      return res.status(401).json({ detail: "Incorrect username or password" });
    }

    const payload = {
      sub: user.email,
      role: user.role
    };

    const token = jwt.sign(payload, process.env.SECRET_KEY, {
      expiresIn: '30m' // Match access token expire minutes from Python
    });

    return res.status(200).json({
      access_token: token,
      token_type: "bearer"
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ detail: "Server error during login" });
  }
};
