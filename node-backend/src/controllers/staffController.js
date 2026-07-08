const Staff = require('../models/Staff');

exports.listStaff = async (req, res) => {
  try {
    const { q } = req.query;
    let query = {};
    if (q) {
      query = {
        $or: [
          { id: { $regex: q, $options: 'i' } },
          { name: { $regex: q, $options: 'i' } },
          { department: { $regex: q, $options: 'i' } },
          { designation: { $regex: q, $options: 'i' } },
          { subjects: { $elemMatch: { $regex: q, $options: 'i' } } }
        ]
      };
    }

    const staff = await Staff.find(query).limit(100);
    return res.status(200).json(staff);
  } catch (error) {
    console.error("List staff error:", error);
    return res.status(500).json({ detail: "Server error listing staff members" });
  }
};

exports.createStaff = async (req, res) => {
  try {
    const staffData = req.body;
    if (!staffData.id) {
      return res.status(400).json({ detail: "Staff ID is required" });
    }

    const existing = await Staff.findOne({ id: staffData.id });
    if (existing) {
      return res.status(400).json({ detail: `Staff member with ID ${staffData.id} already exists` });
    }

    const newStaff = new Staff({
      ...staffData,
      _id: staffData.id
    });

    await newStaff.save();
    return res.status(201).json(newStaff);
  } catch (error) {
    console.error("Create staff error:", error);
    return res.status(500).json({ detail: "Server error creating staff member" });
  }
};

exports.updateStaff = async (req, res) => {
  try {
    const { staffId } = req.params;
    const staffData = req.body;

    const existing = await Staff.findOne({ id: staffId });
    if (!existing) {
      return res.status(404).json({ detail: `Staff member ${staffId} not found` });
    }

    const updatedStaff = await Staff.findOneAndUpdate(
      { id: staffId },
      { ...staffData, id: staffId, _id: staffId },
      { new: true, runValidators: true }
    );

    return res.status(200).json(updatedStaff);
  } catch (error) {
    console.error("Update staff error:", error);
    return res.status(500).json({ detail: "Server error updating staff member" });
  }
};

exports.deleteStaff = async (req, res) => {
  try {
    const { staffId } = req.params;
    const result = await Staff.deleteOne({ id: staffId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ detail: `Staff member ${staffId} not found` });
    }

    return res.status(200).json({ message: `Staff member ${staffId} deleted successfully` });
  } catch (error) {
    console.error("Delete staff error:", error);
    return res.status(500).json({ detail: "Server error deleting staff member" });
  }
};
