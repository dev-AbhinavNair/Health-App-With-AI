const express = require("express");
const router = express.Router();
const { getProfile, updateProfile, uploadProfilePicture, deleteProfilePicture } = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);

router.get("/profile", getProfile);
router.put("/profile", updateProfile);
router.post("/profile/picture", uploadProfilePicture);
router.delete("/profile/picture", deleteProfilePicture);

module.exports = router;
