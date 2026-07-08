const express = require('express');
const timetableController = require('../controllers/timetableController');

const router = express.Router();

router.get('/stats', timetableController.getStats);
router.get('/list/all', timetableController.listTimetables);
router.post('/generate', timetableController.generate);
router.post('/regenerate', timetableController.regenerate);
router.get('/:timetableId', timetableController.getTimetable);
router.delete('/:timetableId', timetableController.deleteTimetable);
router.put('/:timetableId/slots', timetableController.updateTimetableSlots);

module.exports = router;
