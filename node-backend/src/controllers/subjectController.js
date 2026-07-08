const Subject = require('../models/Subject');

exports.listSubjects = async (req, res) => {
  try {
    const { q } = req.query;
    let query = {};
    if (q) {
      query = {
        $or: [
          { code: { $regex: q, $options: 'i' } },
          { name: { $regex: q, $options: 'i' } },
          { department: { $regex: q, $options: 'i' } }
        ]
      };
    }

    const subjects = await Subject.find(query).limit(100);
    return res.status(200).json(subjects);
  } catch (error) {
    console.error("List subjects error:", error);
    return res.status(500).json({ detail: "Server error listing subjects" });
  }
};

exports.createSubject = async (req, res) => {
  try {
    const subjectData = req.body;
    if (!subjectData.code) {
      return res.status(400).json({ detail: "Subject code is required" });
    }

    const existing = await Subject.findOne({ code: subjectData.code });
    if (existing) {
      return res.status(400).json({ detail: `Subject with code ${subjectData.code} already exists` });
    }

    const newSubject = new Subject({
      ...subjectData,
      _id: subjectData.code
    });

    await newSubject.save();
    return res.status(201).json(newSubject);
  } catch (error) {
    console.error("Create subject error:", error);
    return res.status(500).json({ detail: "Server error creating subject" });
  }
};

exports.updateSubject = async (req, res) => {
  try {
    const { subjectCode } = req.params;
    const subjectData = req.body;

    const existing = await Subject.findOne({ code: subjectCode });
    if (!existing) {
      return res.status(404).json({ detail: `Subject ${subjectCode} not found` });
    }

    const updatedSubject = await Subject.findOneAndUpdate(
      { code: subjectCode },
      { ...subjectData, code: subjectCode, _id: subjectCode },
      { new: true, runValidators: true }
    );

    return res.status(200).json(updatedSubject);
  } catch (error) {
    console.error("Update subject error:", error);
    return res.status(500).json({ detail: "Server error updating subject" });
  }
};

exports.deleteSubject = async (req, res) => {
  try {
    const { subjectCode } = req.params;
    const result = await Subject.deleteOne({ code: subjectCode });

    if (result.deletedCount === 0) {
      return res.status(404).json({ detail: `Subject ${subjectCode} not found` });
    }

    return res.status(200).json({ message: `Subject ${subjectCode} deleted successfully` });
  } catch (error) {
    console.error("Delete subject error:", error);
    return res.status(500).json({ detail: "Server error deleting subject" });
  }
};
