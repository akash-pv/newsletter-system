// routes/articleRoutes.js

const express = require("express");
const path = require("path");
const multer = require("multer");
const db = require("../config/db");
const { authenticateToken } = require("../middleware/auth");
const OpenAI = require("openai");
require("dotenv").config();

// Import notifications helper
const { insertNotification } = require("../models/Notification");

const router = express.Router();

// Utility: Promisify DB queries
const runQuery = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) =>
      err ? reject(err) : resolve(results)
    );
  });

// Multer Storage Setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename:    (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

/**
 * 🔹 8. Get All Approved Articles
 */
router.get(
  "/approved",
  authenticateToken,
  async (req, res) => {
    try {
      const approvedArticles = await runQuery(
        `
        SELECT
          a.id,
          a.title,
          a.content,
          ac.category_name,
          a.submitted_at,
          u.full_name AS submitted_by,
          (SELECT file_path
             FROM ArticleMedia
            WHERE article_id = a.id
            LIMIT 1) AS image_url
        FROM Article a
        JOIN ArticleCategory ac ON a.category_id = ac.id
        JOIN User u ON a.submitted_by = u.id
        WHERE a.status_id = 2
        ORDER BY a.submitted_at DESC
        `
      );
      res.json(approvedArticles);
    } catch (err) {
      console.error("Error fetching approved articles:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

/**
 * 🔹 1. Auto Generate Article Based on Heading
 */
router.post(
  "/generate",
  authenticateToken,
  async (req, res) => {
    const { heading } = req.body;
    if (!heading) {
      return res.status(400).json({ message: "Heading is required." });
    }
    try {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a helpful newsletter article writer." },
          { role: "user",   content: `Write a professional and engaging newsletter article based on this heading: "${heading}".` },
        ],
        max_tokens: 500,
      });
      const generatedContent = completion.choices[0].message.content;
      res.status(200).json({ content: generatedContent });
    } catch (err) {
      console.error("Error generating article:", err);
      res.status(500).json({ message: "Failed to generate article." });
    }
  }
);

/**
 * 🔹 2. Submit an Article
 */
router.post(
  "/submit",
  authenticateToken,
  upload.single("file"),
  async (req, res) => {
    const { title, content, category_id } = req.body;
    const submitted_by = req.user.userId;
    const submitted_by_name = req.user.full_name;
    const file = req.file;

    if (!title || !content || !category_id) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    try {
      // 1) Insert the article
      const result = await runQuery(
        `INSERT INTO Article (title, content, category_id, submitted_by, status_id, submitted_at)
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [title, content, category_id, submitted_by, 1]
      );
      const articleId = result.insertId;

      // 2) Store media if present
      if (file) {
        await runQuery(
          `INSERT INTO ArticleMedia (article_id, file_path, file_type, uploaded_at)
           VALUES (?, ?, ?, NOW())`,
          [articleId, file.filename, file.mimetype]
        );
      }

      // 3) Notify Admins & Approvers
      const notifyRoles = async (roleName) => {
        const users = await runQuery(
          `SELECT u.id
             FROM User u
             JOIN User_Role ur ON u.id = ur.user_id
             JOIN Role r ON ur.role_id = r.id
            WHERE r.role_name = ?`,
          [roleName]
        );
        for (const u of users) {
          insertNotification(
            {
              user_id:    u.id,
              article_id: articleId,
              type:       "submission",
              message:    `New article submitted: "${title}" by ${submitted_by_name}`,
            },
            (err) => err && console.error("Notification error:", err)
          );
        }
      };
      await notifyRoles("Admin");
      await notifyRoles("Approver");

      // 4) Respond
      res.status(201).json({
        message:   "Article submitted successfully",
        articleId,
      });
    } catch (err) {
      console.error("Error submitting article:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

/**
 * 🔹 3. Get Pending Articles
 */
router.get(
  "/pending",
  authenticateToken,
  async (req, res) => {
    try {
      const role = req.user.role;
      if (role !== "Approver" && role !== "Admin") {
        return res.status(403).json({ message: "Access denied." });
      }
      const articles = await runQuery(
        `
        SELECT
          a.id,
          a.title,
          a.content,
          ac.category_name,
          u.full_name AS submitted_by,
          a.submitted_at
        FROM Article a
        JOIN ArticleCategory ac ON a.category_id = ac.id
        JOIN User u ON a.submitted_by = u.id
        WHERE a.status_id = 1
        ORDER BY a.submitted_at DESC
        `
      );
      res.json(articles);
    } catch (err) {
      console.error("Error fetching pending articles:", err);
      res.status(500).json({ message: "Server error." });
    }
  }
);

/**
 * 🔹 4. Review Article
 */
router.post(
  "/review",
  authenticateToken,
  async (req, res) => {
    const { article_id, action, reason } = req.body;
    const approved_by = req.user.userId;
    const approved_by_name = req.user.full_name;

    const statusMap = { Approved: 2, Rejected: 3, Returned: 4 };
    const notificationTypeMap = { Approved: "approval", Rejected: "rejection", Returned: "return" };
    const status_id = statusMap[action];

    if (!article_id || !status_id) {
      return res.status(400).json({ message: "Invalid request data" });
    }

    try {
      // 1) Log workflow
      await runQuery(
        `INSERT INTO ArticleWorkflow
           (article_id, approved_by, action, action_reason, action_timestamp)
         VALUES (?, ?, ?, ?, NOW())`,
        [article_id, approved_by, action, reason || null]
      );

      // 2) Update status
      await runQuery(
        `UPDATE Article
           SET status_id = ?
         WHERE id = ?`,
        [status_id, article_id]
      );

      // 3) Notify the original submitter
      const rows = await runQuery(
        `SELECT submitted_by FROM Article WHERE id = ?`,
        [article_id]
      );
      if (rows.length) {
        const submitterId = rows[0].submitted_by;
        insertNotification(
          {
            user_id:    submitterId,
            article_id,
            type:       notificationTypeMap[action],
            message:    `Your article #${article_id} was ${action.toLowerCase()} by ${approved_by_name}`,
          },
          (err) => err && console.error("Notification error:", err)
        );
      }

      // 4) Respond
      res.status(200).json({ message: `Article ${action.toLowerCase()} successfully` });
    } catch (err) {
      console.error("Error reviewing article:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

/**
 * 🔹 5. Get Articles Submitted by Logged-in User
 */
router.get(
  "/user",
  authenticateToken,
  async (req, res) => {
    const userId = req.user.userId;
    try {
      const articles = await runQuery(
        `
        SELECT
          a.id,
          a.title,
          a.content,              -- include the article body
          a.submitted_at,
          s.status_name   AS status,
          (
            SELECT w.action_reason
              FROM ArticleWorkflow w
             WHERE w.article_id = a.id
             ORDER BY w.action_timestamp DESC
             LIMIT 1
          ) AS remarks
        FROM Article a
        JOIN ArticleStatus s ON a.status_id = s.id
        WHERE a.submitted_by = ?
        ORDER BY a.submitted_at DESC
        `,
        [userId]
      );
      res.json(articles);
    } catch (err) {
      console.error("Error fetching user articles:", err);
      res.status(500).json({ message: "Server error." });
    }
  }
);

/**
 * 🔹 7. Search & Paginate Articles
 */
router.get(
  "/search",
  authenticateToken,
  async (req, res) => {
    const { page = 1, limit = 10, keyword = "" } = req.query;
    const offset = (page - 1) * limit;
    try {
      const articles = await runQuery(
        `
        SELECT
          a.id,
          a.title,
          a.submitted_at,
          s.status_name AS status,
          ac.category_name,
          u.full_name    AS submitted_by
        FROM Article a
        JOIN ArticleStatus  s  ON a.status_id   = s.id
        JOIN ArticleCategory ac ON a.category_id = ac.id
        JOIN User u            ON a.submitted_by = u.id
        WHERE a.title LIKE ? OR a.content LIKE ?
        ORDER BY a.submitted_at DESC
        LIMIT ? OFFSET ?
        `,
        [`%${keyword}%`, `%${keyword}%`, parseInt(limit), parseInt(offset)]
      );
      res.json(articles);
    } catch (err) {
      console.error("Error searching articles:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

module.exports = router;
