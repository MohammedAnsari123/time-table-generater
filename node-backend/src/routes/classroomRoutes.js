const express = require('express');
const classroomController = require('../controllers/classroomController');

const router = express.Router();

router.get('/', classroomController.listClassrooms);
router.post('/', classroomController.createClassroom);
router.put('/:roomId', classroomController.updateClassroom);
router.delete('/:roomId', classroomController.deleteClassroom);

module.exports = router;
