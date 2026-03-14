// models/Notification.js

const db = require("../config/db");

/**
 * Insert a new notification.
 * @param {{ user_id: number, article_id?: number, type: string, message: string }} notif
 * @param {(err: Error, result: any) => void} callback
 */
function insertNotification(notif, callback) {
  const sql = `
    INSERT INTO notification
      (user_id, article_id, type, message, is_read, created_at)
    VALUES
      (?,       ?,          ?,    ?,       FALSE,   NOW())
  `;
  const params = [
    notif.user_id,
    notif.article_id || null,
    notif.type,
    notif.message
  ];
  db.query(sql, params, callback);
}

/**
 * Fetch notifications for a specific user.
 * @param {number} userId
 * @param {(err: Error, results: any[]) => void} callback
 */
function getNotificationsByUser(userId, callback) {
  const sql = `
    SELECT id, article_id, type, message, is_read, created_at
    FROM notification
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 50
  `;
  db.query(sql, [userId], callback);
}

/**
 * Mark a notification as read.
 * @param {number} notificationId
 * @param {(err: Error, result: any) => void} callback
 */
function markAsRead(notificationId, callback) {
  const sql = `
    UPDATE notification
    SET is_read = TRUE
    WHERE id = ?
  `;
  db.query(sql, [notificationId], callback);
}

module.exports = {
  insertNotification,
  getNotificationsByUser,
  markAsRead,
};
