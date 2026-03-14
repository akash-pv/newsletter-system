require("dotenv").config();
const express = require("express");
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const router = express.Router();

const db = require("../config/db");
const { authenticateToken } = require("../middleware/auth");

// ──────────────────────────────────────────────────────────────
// Updated HTML generator with watermark + footer (no page gap)
function generateNewsletterHTML({ title, date, articles, numColumns }) {
  const cols = parseInt(numColumns, 10) || 3;
  let articlesHTML = "";

  for (const a of articles) {
    articlesHTML += `
      <div class="article border border-gray-300 bg-white rounded-md shadow-sm p-3 flex flex-col">
        <h3 class="text-xl font-bold mb-2 text-black leading-tight">${a.title}</h3>
        ${
          a.image_url
            ? `<img src="http://localhost:5000/uploads/${a.image_url}" alt="${a.title}"
                 class="float-left mr-3 mb-2 w-1/3 object-cover rounded"
                 style="max-width:120px;" onerror="this.style.display='none'"/>`
            : ""
        }
        <p class="text-gray-800 text-sm text-justify leading-relaxed">${a.content.replace(/\n/g, "<br>")}</p>
      </div>
    `;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>${title}</title>
<script src="https://cdn.tailwindcss.com"></script>
<style>
  @page { size: A3 portrait; margin: 0 }
  html, body {
    margin: 0;
    padding: 0;
    font-family: Helvetica, Arial, sans-serif;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    line-height: 1.4;
    background: white;
  }

  /* Watermark */
  body::before {
    content: "";
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 400px;
    height: 400px;
    background-image: url('http://localhost:5000/uploads/zinglogo.png');
    background-repeat: no-repeat;
    background-size: contain;
    opacity: 0.06;
    z-index: 0;
    pointer-events: none;
  }

  .wrapper {
    padding: 25mm;
    page-break-inside: avoid;
    position: relative;
    z-index: 1;
  }

  .main-title {
    text-align: center;
    font-size: 36px;
    font-weight: 800;
    margin-bottom: 4mm;
  }

  .sub-title-date {
    text-align: center;
    font-size: 14px;
    color: #555;
    margin-bottom: 8mm;
  }

  .divider {
    border-bottom: 4px solid black;
    margin: 4mm 0 6mm;
  }

  .grid-container {
    display: grid;
    gap: 15px;
    grid-template-columns: repeat(${cols}, minmax(0, 1fr));
    grid-auto-rows: min-content;
    grid-auto-flow: row dense;
  }

  .article {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  .clearfix::after {
    content: "";
    display: block;
    clear: both;
  }

  .footer {
    margin-top: 20mm;
    text-align: center;
    font-size: 12px;
    color: #888;
    page-break-inside: avoid;
  }
</style>
</head>
<body>
  <div class="wrapper">
    <div class="main-title">${title}</div>
    <div class="sub-title-date">${date}</div>
    <div class="divider"></div>
    <div class="grid-container">${articlesHTML}</div>

    <div class="footer">
      © 2025 ZingHR. All rights reserved.
    </div>
  </div>
</body>
</html>`;
}

// ──────────────────────────────────────────────────────────────
// 1) POST /generate → HTML → PDF
router.post("/generate", authenticateToken, async (req, res) => {
  try {
    const { title, date, articles, numColumns } = req.body;
    if (!title || !Array.isArray(articles) || articles.length === 0) {
      return res.status(400).json({ message: "Title and at least one article required." });
    }

    const html = generateNewsletterHTML({ title, date, articles, numColumns });
    const uploadsDir = path.join(__dirname, "..", "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filename = `newsletter_${Date.now()}.pdf`;
    const pdfPath = path.join(uploadsDir, filename);

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    await page.pdf({
      path: pdfPath,
      format: "A3",
      printBackground: true,
      margin: { top: "0mm", right: "0mm", bottom: "0mm", left: "0mm" },
      preferCSSPageSize: true,
    });
    await browser.close();

    // Save record in DB
    db.query(
      "INSERT INTO newsletter (title, pdf_file, published_date) VALUES (?, ?, NOW())",
      [title, filename],
      (err) => {
        if (err) {
          console.error("DB insert error:", err);
          fs.unlinkSync(pdfPath);
          return res.status(500).json({ message: "Error saving newsletter." });
        }
        res.json({ message: "PDF generated successfully!", pdf_filename: filename });
      }
    );
  } catch (err) {
    console.error("PDF generation error:", err);
    res.status(500).json({ message: "Error generating PDF." });
  }
});

// ──────────────────────────────────────────────────────────────
// 2) GET /download/:filename → serve PDF
router.get("/download/:filename", (req, res) => {
  const file = path.join(__dirname, "..", "uploads", req.params.filename);
  if (fs.existsSync(file)) {
    return res.download(file);
  }
  res.status(404).json({ message: "File not found." });
});

// ──────────────────────────────────────────────────────────────
// 3) GET / → list all newsletters
router.get("/", authenticateToken, (req, res) => {
  db.query(
    "SELECT id, title, pdf_file, published_date FROM newsletter ORDER BY published_date DESC",
    (err, rows) => {
      if (err) {
        console.error("DB fetch error:", err);
        return res.status(500).json({ message: "Error fetching newsletters." });
      }
      res.json(rows);
    }
  );
});

// ──────────────────────────────────────────────────────────────
// 4) POST /newsletter/email → attach & send
const nodemailer = require("nodemailer");
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

router.post("/email", authenticateToken, async (req, res) => {
  try {
    const { pdfFile, recipients, subject, body } = req.body;
    if (!pdfFile || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ message: "Invalid email payload." });
    }

    const filePath = path.join(__dirname, "..", "uploads", pdfFile);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "PDF not found." });
    }

    await transporter.sendMail({
      from: `"ZINGUPDATE" <${process.env.SMTP_USER}>`,
      bcc: recipients.join(", "),
      subject,
      text: body,
      attachments: [{ filename: pdfFile, path: filePath }],
    });

    res.json({ message: "Email sent successfully!" });
  } catch (err) {
    console.error("Email error:", err);
    res.status(500).json({ message: "Failed to send email." });
  }
});

module.exports = router;
