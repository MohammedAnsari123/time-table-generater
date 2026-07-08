const Laboratory = require('../models/Laboratory');

exports.listLabs = async (req, res) => {
  try {
    const { q } = req.query;
    let query = {};
    if (q) {
      query = {
        $or: [
          { id: { $regex: q, $options: 'i' } },
          { name: { $regex: q, $options: 'i' } },
          { department: { $regex: q, $options: 'i' } },
          { supported_subjects: { $elemMatch: { $regex: q, $options: 'i' } } }
        ]
      };
    }

    const labs = await Laboratory.find(query).limit(100);
    return res.status(200).json(labs);
  } catch (error) {
    console.error("List labs error:", error);
    return res.status(500).json({ detail: "Server error listing laboratories" });
  }
};

exports.createLab = async (req, res) => {
  try {
    const labData = req.body;
    if (!labData.id) {
      return res.status(400).json({ detail: "Laboratory ID is required" });
    }

    const existing = await Laboratory.findOne({ id: labData.id });
    if (existing) {
      return res.status(400).json({ detail: `Laboratory {labData.id} already exists` });
    }

    const newLab = new Laboratory({
      ...labData,
      _id: labData.id
    });

    await newLab.save();
    return res.status(201).json(newLab);
  } catch (error) {
    console.error("Create lab error:", error);
    return res.status(500).json({ detail: "Server error creating laboratory" });
  }
};

exports.updateLab = async (req, res) => {
  try {
    const { labId } = req.params;
    const labData = req.body;

    const existing = await Laboratory.findOne({ id: labId });
    if (!existing) {
      return res.status(404).json({ detail: `Laboratory ${labId} not found` });
    }

    const updatedLab = await Laboratory.findOneAndUpdate(
      { id: labId },
      { ...labData, id: labId, _id: labId },
      { new: true, runValidators: true }
    );

    return res.status(200).json(updatedLab);
  } catch (error) {
    console.error("Update lab error:", error);
    return res.status(500).json({ detail: "Server error updating laboratory" });
  }
};

exports.deleteLab = async (req, res) => {
  try {
    const { labId } = req.params;
    const result = await Laboratory.deleteOne({ id: labId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ detail: `Laboratory ${labId} not found` });
    }

    return res.status(200).json({ message: `Laboratory ${labId} deleted successfully` });
  } catch (error) {
    console.error("Delete lab error:", error);
    return res.status(500).json({ detail: "Server error deleting laboratory" });
  }
};
