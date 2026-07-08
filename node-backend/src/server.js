const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Configure CORS
app.use(cors({
  origin: '*', // Allow all origins for development (matching python FastAPI CORS)
  credentials: false
}));

// Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root route
app.get('/', (req, res) => {
  res.json({ message: "Time Table Generator Node.js API is running" });
});

// Attach routers
app.use('/auth', require('./routes/authRoutes'));
app.use('/classrooms', require('./routes/classroomRoutes'));
app.use('/labs', require('./routes/labRoutes'));
app.use('/staff', require('./routes/staffRoutes'));
app.use('/subjects', require('./routes/subjectRoutes'));
app.use('/timetable', require('./routes/timetableRoutes'));

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ detail: err.message || "Something went wrong on the server" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
