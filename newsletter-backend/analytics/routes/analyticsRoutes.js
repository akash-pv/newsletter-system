// analytics/routes/analyticsRoutes.js
// Mount this in your server.js:  app.use('/api/analytics', require('./analytics/routes/analyticsRoutes'))

const express = require('express');
const router = express.Router();
const { Parser } = require('json2csv');  // npm install json2csv
const analyticsService = require('../services/analyticsService');

// Middleware — reuse your existing auth middleware
// Uncomment the line below if you have auth middleware
// const { verifyToken, isAdmin } = require('../../newsletter-backend/middleware/auth');

// ── GET /api/analytics/dashboard ────────────────────────────────────────────
// Main KPI summary — used by dashboard page
router.get('/dashboard', async (req, res) => {
    try {
        const data = await analyticsService.getDashboardSummary();
        res.json({ success: true, data });
    } catch (err) {
        console.error('Analytics dashboard error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch dashboard analytics' });
    }
});

// ── GET /api/analytics/newsletters ──────────────────────────────────────────
// Per-newsletter open rate, click rate, recipients
router.get('/newsletters', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const data = await analyticsService.getNewsletterPerformance(limit);
        res.json({ success: true, data });
    } catch (err) {
        console.error('Newsletter performance error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch newsletter performance' });
    }
});

// ── GET /api/analytics/articles ─────────────────────────────────────────────
// Article stats — AI vs manual, approval times, weekly trend
router.get('/articles', async (req, res) => {
    try {
        const data = await analyticsService.getArticleAnalytics();
        res.json({ success: true, data });
    } catch (err) {
        console.error('Article analytics error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch article analytics' });
    }
});

// ── GET /api/analytics/subscribers ──────────────────────────────────────────
// Most engaged subscribers
router.get('/subscribers', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const data = await analyticsService.getTopSubscribers(limit);
        res.json({ success: true, data });
    } catch (err) {
        console.error('Subscriber analytics error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch subscriber analytics' });
    }
});

// ── GET /api/analytics/export/csv ───────────────────────────────────────────
// Downloads weekly summary as CSV file
router.get('/export/csv', async (req, res) => {
    try {
        const data = await analyticsService.getWeeklySummaryData();

        const fields = [
            { label: 'Week Start', value: 'week_start' },
            { label: 'Week End', value: 'week_end' },
            { label: 'Newsletters Sent', value: 'total_newsletters_sent' },
            { label: 'Articles Submitted', value: 'total_articles_submitted' },
            { label: 'Articles Approved', value: 'total_articles_approved' },
            { label: 'AI Generated', value: 'ai_generated_count' },
            { label: 'Manual', value: 'manual_count' },
            { label: 'Avg Approval Time (mins)', value: 'avg_approval_time_minutes' },
            { label: 'Avg Open Rate (%)', value: 'avg_open_rate' },
            { label: 'Avg Click Rate (%)', value: 'avg_click_rate' },
        ];

        const parser = new Parser({ fields });
        const csv = parser.parse(data);

        const filename = `newsletter_analytics_${new Date().toISOString().split('T')[0]}.csv`;

        res.header('Content-Type', 'text/csv');
        res.header('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(csv);
    } catch (err) {
        console.error('CSV export error:', err);
        res.status(500).json({ success: false, message: 'Failed to export CSV' });
    }
});

// ── POST /api/analytics/track/open ──────────────────────────────────────────
// Called when a subscriber opens a newsletter (from tracking pixel or frontend)
router.post('/track/open', async (req, res) => {
    try {
        const { newsletter_send_id, subscriber_email } = req.body;
        if (!newsletter_send_id || !subscriber_email) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        await db.promise().query(
            'INSERT INTO newsletter_opens (newsletter_send_id, subscriber_email) VALUES (?, ?)',
            [newsletter_send_id, subscriber_email]
        );

        res.json({ success: true, message: 'Open tracked' });
    } catch (err) {
        console.error('Track open error:', err);
        res.status(500).json({ success: false, message: 'Failed to track open' });
    }
});

// ── POST /api/analytics/track/click ─────────────────────────────────────────
// Called when a subscriber clicks an article link
router.post('/track/click', async (req, res) => {
    try {
        const { newsletter_send_id, subscriber_email, article_title } = req.body;
        if (!newsletter_send_id || !subscriber_email) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        await db.promise().query(
            'INSERT INTO newsletter_clicks (newsletter_send_id, subscriber_email, article_title) VALUES (?, ?, ?)',
            [newsletter_send_id, subscriber_email, article_title || null]
        );

        res.json({ success: true, message: 'Click tracked' });
    } catch (err) {
        console.error('Track click error:', err);
        res.status(500).json({ success: false, message: 'Failed to track click' });
    }
});

module.exports = router;
