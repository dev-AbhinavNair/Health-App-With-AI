const User = require("../models/User");
const cloudinary = require("../config/cloudinary");

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-otp -otpExpires");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, age, medicalConditions, medications } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (name !== undefined) user.name = name;
    if (age !== undefined) user.age = age;
    if (medicalConditions !== undefined) user.medicalConditions = medicalConditions;
    if (medications !== undefined) user.medications = medications;

    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      age: user.age,
      profilePicture: user.profilePicture,
      medicalConditions: user.medicalConditions,
      medications: user.medications,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const uploadProfilePicture = async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ message: "No image provided" });
    }

    const result = await cloudinary.uploader.upload(image, {
      folder: `profile-pictures/${req.user._id}`,
      width: 300,
      height: 300,
      crop: "fill",
      quality: "auto",
    });

    const user = await User.findById(req.user._id);
    user.profilePicture = result.secure_url;
    user.profilePicturePublicId = result.public_id;
    await user.save();

    res.json({ url: result.secure_url });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteProfilePicture = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.profilePicturePublicId) {
      await cloudinary.uploader.destroy(user.profilePicturePublicId);
    }

    user.profilePicture = undefined;
    user.profilePicturePublicId = undefined;
    await user.save();

    res.json({ message: "Profile picture removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getProfile, updateProfile, uploadProfilePicture, deleteProfilePicture };
