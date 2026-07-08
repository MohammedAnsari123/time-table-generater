const express = require('express');
const multer = require('multer');
const authController = require('../controllers/authController');

const router = express.Router();
const upload = multer();

router.post('/register', authController.register);
router.post('/login', upload.none(), authController.login);

module.exports = router;
