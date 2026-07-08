const express = require('express');
const subjectController = require('../controllers/subjectController');

const router = express.Router();

router.get('/', subjectController.listSubjects);
router.post('/', subjectController.createSubject);
router.put('/:subjectCode', subjectController.updateSubject);
router.delete('/:subjectCode', subjectController.deleteSubject);

module.exports = router;
