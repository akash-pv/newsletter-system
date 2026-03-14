//routes/notificationRoutes.js


const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const {
  getNotificationsByUser,
  markAsRead,
} = require("../models/Notification");

const router = express.Router();

// Protect all notification routes
router.use(authenticateToken);

/**
 * GET /api/notifications
 * Fetch up to 50 most recent notifications for the logged-in user
 */
router.get("/", (req, res) => {
  const userId = req.user.userId;
  getNotificationsByUser(userId, (err, results) => {
    if (err) {
      console.error("❌ Error fetching notifications:", err);
      return res
        .status(500)
        .json({ message: "Failed to load notifications" });
    }
    res.json(results);
  });
});

/**
 * PATCH /api/notifications/:id/read
 * Mark a single notification as read
 */
router.patch("/:id/read", (req, res) => {
  const notifId = req.params.id;
  markAsRead(notifId, (err) => {
    if (err) {
      console.error("❌ Error marking notification as read:", err);
      return res
        .status(500)
        .json({ message: "Failed to mark notification as read" });
    }
    // 204 No Content is appropriate for a successful update with no body
    res.sendStatus(204);
  });
});

module.exports = router;
