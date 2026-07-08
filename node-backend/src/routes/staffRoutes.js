const express = require('express');
const staffController = require('../controllers/staffController');

const router = express.Router();

router.get('/', staffController.listStaff);
router.post('/', staffController.createStaff);
router.put('/:staffId', staffController.updateStaff);
router.delete('/:staffId', staffController.deleteStaff);

module.exports = router;
