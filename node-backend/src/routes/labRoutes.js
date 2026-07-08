const express = require('express');
const labController = require('../controllers/labController');

const router = express.Router();

router.get('/', labController.listLabs);
router.post('/', labController.createLab);
router.put('/:labId', labController.updateLab);
router.delete('/:labId', labController.deleteLab);

module.exports = router;
