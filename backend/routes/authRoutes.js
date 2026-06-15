const express = require("express");
const {
  registerUser,
  requestOTP,
  verifyOTP,
  refreshUserToken,
} = require("../controllers/authController");
const router = express.Router();

router.post("/register", registerUser);
router.post("/request-otp", requestOTP);
router.post("/verify-otp", verifyOTP);
router.post("/refresh", refreshUserToken);

module.exports = router;
