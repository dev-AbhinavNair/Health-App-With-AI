const express = require("express");
const router = express.Router();
const {
  createChat,
  getUserChats,
  getChatById,
  sendMessage,
  generateAISummary,
  aiRespond,
  doctorReview,
  forwardChat,
  assignDoctor,
  flagRecommendation,
} = require("../controllers/chatController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.use(protect);

router.route("/").post(createChat).get(getUserChats);

router.route("/:id").get(getChatById);

router.route("/:id/messages").post(sendMessage);

router.route("/:id/ai-summary").post(generateAISummary);

router.route("/:id/ai-respond").post(aiRespond);

router
  .route("/:id/assign-doctor")
  .put(authorize("doctor", "admin"), assignDoctor);

router.route("/:id/review").put(authorize("doctor", "admin"), doctorReview);

router.route("/:id/forward").put(authorize("doctor", "admin"), forwardChat);

router.route("/:id/flag-recommendation").post(authorize("doctor", "admin"), flagRecommendation);

module.exports = router;
