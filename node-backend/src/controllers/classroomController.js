const Classroom = require('../models/Classroom');

exports.listClassrooms = async (req, res) => {
  try {
    const { q } = req.query;
    let query = {};
    if (q) {
      query = {
        $or: [
          { id: { $regex: q, $options: 'i' } },
          { name: { $regex: q, $options: 'i' } },
          { building: { $regex: q, $options: 'i' } }
        ]
      };
    }

    const classrooms = await Classroom.find(query).limit(100);
    return res.status(200).json(classrooms);
  } catch (error) {
    console.error("List classrooms error:", error);
    return res.status(500).json({ detail: "Server error listing classrooms" });
  }
};

exports.createClassroom = async (req, res) => {
  try {
    const roomData = req.body;
    if (!roomData.id) {
      return res.status(400).json({ detail: "Classroom ID is required" });
    }

    const existing = await Classroom.findOne({ id: roomData.id });
    if (existing) {
      return res.status(400).json({ detail: `Classroom ${roomData.id} already exists` });
    }

    const newRoom = new Classroom({
      ...roomData,
      _id: roomData.id
    });

    await newRoom.save();
    return res.status(201).json(newRoom);
  } catch (error) {
    console.error("Create classroom error:", error);
    return res.status(500).json({ detail: "Server error creating classroom" });
  }
};

exports.updateClassroom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const roomData = req.body;

    const existing = await Classroom.findOne({ id: roomId });
    if (!existing) {
      return res.status(404).json({ detail: `Classroom ${roomId} not found` });
    }

    const updatedRoom = await Classroom.findOneAndUpdate(
      { id: roomId },
      { ...roomData, id: roomId, _id: roomId },
      { new: true, runValidators: true }
    );

    return res.status(200).json(updatedRoom);
  } catch (error) {
    console.error("Update classroom error:", error);
    return res.status(500).json({ detail: "Server error updating classroom" });
  }
};

exports.deleteClassroom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const result = await Classroom.deleteOne({ id: roomId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ detail: `Classroom ${roomId} not found` });
    }

    return res.status(200).json({ message: `Classroom ${roomId} deleted successfully` });
  } catch (error) {
    console.error("Delete classroom error:", error);
    return res.status(500).json({ detail: "Server error deleting classroom" });
  }
};
