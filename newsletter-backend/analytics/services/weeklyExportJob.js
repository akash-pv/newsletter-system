// analytics/services/weeklyExportJob.js
// Automated weekly CSV export - runs every Monday at 8 AM
// Add to your server.js:  require('./analytics/services/weeklyExportJob')

const cron = require('node-cron');   // npm install node-cron
const fs = require('fs');
const path = require('path');
const { Parser } = require('json2csv');
const analyticsService = require('./analyticsService');

// Ensure exports directory exists
const EXPORTS_DIR = path.join(__dirname, '../exports');
if (!fs.existsSync(EXPORTS_DIR)) {
    fs.mkdirSync(EXPORTS_DIR, { recursive: true });
}

// ── GENERATE AND SAVE CSV ────────────────────────────────────────────────────
async function generateWeeklyCSV() {
    try {
        console.log('[Analytics] Generating weekly CSV report...');

        const data = await analyticsService.getWeeklySummaryData();

        if (!data || data.length === 0) {
            console.log('[Analytics] No data available for CSV export.');
            return;
        }

        const fields = [
            { label: 'Week Start', value: 'week_start' },
            { label: 'Week End', value: 'week_end' },
            { label: 'Newsletters Sent', value: 'total_newsletters_sent' },
            { label: 'Articles Submitted', value: 'total_articles_submitted' },
            { label: 'Articles Approved', value: 'total_articles_approved' },
            { label: 'Articles Rejected', value: 'total_articles_rejected' },
            { label: 'AI Generated Articles', value: 'ai_generated_count' },
            { label: 'Manually Written Articles', value: 'manual_count' },
            { label: 'Avg Approval Time (mins)', value: 'avg_approval_time_minutes' },
            { label: 'Avg Open Rate (%)', value: 'avg_open_rate' },
            { label: 'Avg Click Rate (%)', value: 'avg_click_rate' },
        ];

        const parser = new Parser({ fields });
        const csv = parser.parse(data);

        const date = new Date().toISOString().split('T')[0];
        const filename = `weekly_analytics_${date}.csv`;
        const filepath = path.join(EXPORTS_DIR, filename);

        fs.writeFileSync(filepath, csv);
        console.log(`[Analytics] Weekly CSV saved: ${filepath}`);

        // Clean up CSVs older than 90 days
        cleanOldExports(90);

    } catch (err) {
        console.error('[Analytics] Weekly CSV generation failed:', err);
    }
}

// ── CLEAN OLD EXPORTS ────────────────────────────────────────────────────────
function cleanOldExports(daysToKeep) {
    const cutoff = Date.now() - daysToKeep * 24 * 60 * 60 * 1000;
    fs.readdirSync(EXPORTS_DIR).forEach(file => {
        const filepath = path.join(EXPORTS_DIR, file);
        const stat = fs.statSync(filepath);
        if (stat.mtimeMs < cutoff) {
            fs.unlinkSync(filepath);
            console.log(`[Analytics] Deleted old export: ${file}`);
        }
    });
}

// ── SCHEDULE ─────────────────────────────────────────────────────────────────
// Runs every Monday at 8:00 AM
cron.schedule('0 8 * * 1', () => {
    console.log('[Analytics] Running scheduled weekly CSV export...');
    generateWeeklyCSV();
});

console.log('[Analytics] Weekly CSV export job scheduled (Every Monday 8AM)');

// Export for manual trigger via API if needed
module.exports = { generateWeeklyCSV };
