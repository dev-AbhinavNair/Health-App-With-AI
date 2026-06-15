const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  saveVerification,
  getUploadSignature,
  getVerificationStatus,
  saveDocument,
  submitApplication,
  viewDocument,
} = require("../controllers/verificationController");

router.use(protect);

router.post("/save", saveVerification);
router.get("/upload-signature", getUploadSignature);
router.get("/status", getVerificationStatus);
router.post("/documents", saveDocument);
router.put("/submit", submitApplication);
router.get("/documents/view", viewDocument);

module.exports = router;
