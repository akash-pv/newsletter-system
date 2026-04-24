// newsletter-frontend/src/pages/AnalyticsDashboard.jsx
// Add this route in your App.jsx:
// import AnalyticsDashboard from './pages/AnalyticsDashboard'
// <Route path="/analytics" element={<AnalyticsDashboard />} />

import { useState, useEffect } from "react";

const API = "/api/analytics"; // adjust if your base URL is different

// ── SMALL STAT CARD ──────────────────────────────────────────────────────────
function KPICard({ label, value, sub, color = "blue" }) {
  const colors = {
    blue:   "bg-blue-50 border-blue-200 text-blue-700",
    green:  "bg-green-50 border-green-200 text-green-700",
    purple: "bg-purple-50 border-purple-200 text-purple-700",
    orange: "bg-orange-50 border-orange-200 text-orange-700",
  };
  return (
    <div className={`rounded-xl border p-5 ${colors[color]}`}>
      <p className="text-sm font-medium opacity-70">{label}</p>
      <p className="text-3xl font-bold mt-1">{value ?? "—"}</p>
      {sub && <p className="text-xs mt-1 opacity-60">{sub}</p>}
    </div>
  );
}

// ── SECTION WRAPPER ──────────────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">{title}</h2>
      {children}
    </div>
  );
}

// ── MAIN DASHBOARD ───────────────────────────────────────────────────────────
export default function AnalyticsDashboard() {
  const [summary, setSummary]         = useState(null);
  const [newsletters, setNewsletters] = useState([]);
  const [articles, setArticles]       = useState(null);
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [exporting, setExporting]     = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    setLoading(true);
    setError(null);
    try {
      const [s, n, a, sub] = await Promise.all([
        fetch(`${API}/dashboard`).then(r => r.json()),
        fetch(`${API}/newsletters?limit=10`).then(r => r.json()),
        fetch(`${API}/articles`).then(r => r.json()),
        fetch(`${API}/subscribers?limit=10`).then(r => r.json()),
      ]);
      if (s.success)   setSummary(s.data);
      if (n.success)   setNewsletters(n.data);
      if (a.success)   setArticles(a.data);
      if (sub.success) setSubscribers(sub.data);
    } catch (err) {
      setError("Failed to load analytics. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCSVExport() {
    setExporting(true);
    try {
      const res = await fetch(`${API}/export/csv`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `newsletter_analytics_${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("CSV export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-lg">
        Loading analytics...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-500">
        {error}
      </div>
    );
  }

  const nl  = summary?.newsletters  || {};
  const art = summary?.articles      || {};
  const eng = summary?.engagement    || {};

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* ── HEADER ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Newsletter Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">
            Last newsletter sent: {nl.last_sent || "N/A"}
          </p>
        </div>
        <button
          onClick={handleCSVExport}
          disabled={exporting}
          className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
        >
          {exporting ? "Exporting..." : "Export Weekly CSV"}
        </button>
      </div>

      {/* ── KPI CARDS ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KPICard label="Newsletters Sent"   value={nl.total_sent}        color="blue"   />
        <KPICard label="Avg Open Rate"      value={`${eng.avg_open_rate}%`}  color="green"  />
        <KPICard label="Avg Click Rate"     value={`${eng.avg_click_rate}%`} color="purple" />
        <KPICard
          label="AI Time Saved"
          value={`${art.ai_time_saved_percent}%`}
          sub="vs manual writing"
          color="orange"
        />
      </div>

      {/* ── ARTICLE BREAKDOWN ── */}
      <Section title="Article Creation — AI vs Manual">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <KPICard label="Total Submitted"  value={art.total_submitted}  color="blue"   />
          <KPICard label="Approved"         value={art.total_approved}   color="green"  />
          <KPICard label="AI Generated"     value={art.ai_generated}     color="purple" />
          <KPICard
            label="Avg Approval Time"
            value={`${art.avg_approval_minutes} min`}
            color="orange"
          />
        </div>

        {articles?.byType && (
          <table className="w-full text-sm mt-2">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-2">Type</th>
                <th className="pb-2">Count</th>
                <th className="pb-2">Avg Creation Time</th>
                <th className="pb-2">Avg Approval Time</th>
              </tr>
            </thead>
            <tbody>
              {articles.byType.map((row, i) => (
                <tr key={i} className="border-b last:border-0 text-gray-700">
                  <td className="py-2 font-medium">{row.type}</td>
                  <td className="py-2">{row.count}</td>
                  <td className="py-2">{row.avg_creation_minutes} min</td>
                  <td className="py-2">{row.avg_approval_minutes} min</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      {/* ── NEWSLETTER PERFORMANCE TABLE ── */}
      <Section title="Newsletter Performance">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-2">Newsletter</th>
                <th className="pb-2">Sent</th>
                <th className="pb-2">Recipients</th>
                <th className="pb-2">Opens</th>
                <th className="pb-2">Open Rate</th>
                <th className="pb-2">Clicks</th>
                <th className="pb-2">Click Rate</th>
              </tr>
            </thead>
            <tbody>
              {newsletters.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-gray-400">
                    No newsletters sent yet.
                  </td>
                </tr>
              )}
              {newsletters.map((n, i) => (
                <tr key={i} className="border-b last:border-0 text-gray-700 hover:bg-gray-50">
                  <td className="py-2 font-medium max-w-xs truncate">{n.title}</td>
                  <td className="py-2 text-gray-500">{n.sent_date}</td>
                  <td className="py-2">{n.total_recipients}</td>
                  <td className="py-2">{n.opens}</td>
                  <td className="py-2">
                    <span className={`font-semibold ${parseFloat(n.open_rate) >= 20 ? "text-green-600" : "text-orange-500"}`}>
                      {n.open_rate}%
                    </span>
                  </td>
                  <td className="py-2">{n.clicks}</td>
                  <td className="py-2">
                    <span className={`font-semibold ${parseFloat(n.click_rate) >= 5 ? "text-green-600" : "text-orange-500"}`}>
                      {n.click_rate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ── TOP SUBSCRIBERS ── */}
      <Section title="Most Engaged Subscribers">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="pb-2">#</th>
              <th className="pb-2">Email</th>
              <th className="pb-2">Newsletters Opened</th>
              <th className="pb-2">Last Opened</th>
            </tr>
          </thead>
          <tbody>
            {subscribers.length === 0 && (
              <tr>
                <td colSpan={4} className="py-6 text-center text-gray-400">
                  No engagement data yet.
                </td>
              </tr>
            )}
            {subscribers.map((s, i) => (
              <tr key={i} className="border-b last:border-0 text-gray-700">
                <td className="py-2 text-gray-400">{i + 1}</td>
                <td className="py-2 font-medium">{s.subscriber_email}</td>
                <td className="py-2">{s.newsletters_opened}</td>
                <td className="py-2 text-gray-500">
                  {new Date(s.last_opened).toLocaleDateString("en-IN", {
                    day: "2-digit", month: "short", year: "numeric"
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      {/* ── FOOTER ── */}
      <p className="text-center text-xs text-gray-400 mt-4">
        Analytics refreshed on page load · Auto CSV export every Monday 8 AM
      </p>
    </div>
  );
}
