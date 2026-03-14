// newsletter-backend/index.js

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

// ✅ Load environment variables
dotenv.config();

// ✅ Import route modules
const authRoutes = require("./routes/authRoutes");
const articleRoutes = require("./routes/articleRoutes");
const newsletterRoutes = require("./routes/newsletterRoutes");
const adminRoutes = require("./routes/adminRoutes");
const roleRoutes = require("./routes/roleRoutes");
const faqRoutes = require("./routes/faqRoutes");
const notificationRoutes = require("./routes/notificationRoutes");  // 👈 Import notifications

// ✅ Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ Mount routes
app.use("/auth", authRoutes);
app.use("/articles", articleRoutes);
app.use("/newsletter", newsletterRoutes);
app.use("/admin", adminRoutes);
app.use("/roles", roleRoutes);
app.use("/api/faqs", faqRoutes);
app.use("/api/notifications", notificationRoutes);  // 👈 Mount notifications

// ✅ Health check endpoint
app.get("/", (req, res) => {
  res.send("✅ ZingHR Newsletter Backend is running.");
});

// ✅ Global error handler
app.use((err, req, res, next) => {
  console.error("💥 Server Error:", err.stack || err.message || err);
  const message =
    process.env.NODE_ENV === "production" ? "Internal Server Error" : err.message;
  res.status(err.status || 500).json({ message });
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
