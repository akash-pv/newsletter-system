// routes/authRoutes.js

const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
require("dotenv").config();
const Joi = require("joi");

const router = express.Router();

// 🔹 Utility: Get role name by ID
const getRoleNameById = async (roleId) => {
  try {
    const [result] = await db
      .promise()
      .query("SELECT role_name FROM Role WHERE id = ?", [roleId]);
    if (result.length === 0) throw new Error("Role not found");
    return result[0].role_name;
  } catch (error) {
    throw new Error(error.message);
  }
};

// 🔹 Validation Schema for Registration and Login
const registerSchema = Joi.object({
  full_name: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role_id: Joi.number().required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

// 🔹 Register User
router.post("/register", async (req, res) => {
  const { error } = registerSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const { full_name, email, password, role_id } = req.body;

  try {
    const normalizedEmail = email.toLowerCase();
    const roleName = await getRoleNameById(role_id);

    // 🚫 Prevent direct Admin registration
    if (roleName === "Admin") {
      return res.status(403).json({ message: "Admin registration is not allowed." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const isApproved = roleName === "Employee" ? 1 : 0;

    // Check if email exists
    const [existingUser] = await db
      .promise()
      .query("SELECT id FROM User WHERE email = ?", [normalizedEmail]);
    if (existingUser.length > 0)
      return res.status(400).json({ message: "Email already registered" });

    // Insert into User table
    const [insertedUser] = await db
      .promise()
      .query(
        "INSERT INTO User (full_name, email, password_hash, is_approved) VALUES (?, ?, ?, ?)",
        [full_name, normalizedEmail, hashedPassword, isApproved]
      );

    const userId = insertedUser.insertId;

    // Link user to role
    await db
      .promise()
      .query("INSERT INTO User_Role (user_id, role_id) VALUES (?, ?)", [
        userId,
        role_id,
      ]);

    res.status(201).json({
      message: `Registered successfully as ${roleName}`,
      approval_required: isApproved === 0,
    });
  } catch (error) {
    console.error("❌ Registration error:", error.message);
    res.status(500).json({ message: "Server error during registration" });
  }
});

// 🔹 Login User
router.post("/login", async (req, res) => {
  const { error } = loginSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const { email, password } = req.body;

  try {
    const normalizedEmail = email.toLowerCase();

    // Get user
    const [users] = await db
      .promise()
      .query("SELECT * FROM User WHERE email = ?", [normalizedEmail]);
    if (users.length === 0) return res.status(401).json({ message: "User not found" });

    const user = users[0];

    // Get user role
    const [roleResult] = await db
      .promise()
      .query(
        `SELECT r.role_name FROM User_Role ur
         JOIN Role r ON ur.role_id = r.id
         WHERE ur.user_id = ?`,
        [user.id]
      );
    const role = roleResult[0]?.role_name || "User";

    // 🔒 Require approval only for Admin or Approver
    if ((role === "Admin" || role === "Approver") && user.is_approved === 0) {
      return res.status(403).json({ message: "Your account is pending approval" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    // Generate JWT (now includes full_name)
    const token = jwt.sign(
      {
        userId:    user.id,
        email:     user.email,
        role,
        full_name: user.full_name,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      token,
      user: {
        id:        user.id,
        full_name: user.full_name,
        email:     user.email,
      },
      role,
    });
  } catch (error) {
    console.error("❌ Login error:", error.message);
    res.status(500).json({ message: "Server error during login" });
  }
});

module.exports = router;
