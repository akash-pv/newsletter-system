// src/pages/ApproveArticles.js

import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const ApproveArticles = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedArticles, setExpandedArticles] = useState({});
  const [reasonModal, setReasonModal] = useState({
    show: false,
    articleId: null,
    action: "",
    reason: "",
  });
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [sortOrder, setSortOrder] = useState("");
  const [sortCategory, setSortCategory] = useState("");

  useEffect(() => {
    fetchPendingArticles();
  }, []);

  const fetchPendingArticles = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/articles/pending", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setArticles(res.data);
    } catch (err) {
      console.error("Error fetching articles:", err);
      toast.error("Failed to load articles.");
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  const uniqueCategories = useMemo(() => {
    const names = articles.map((a) => a.category_name || "");
    return Array.from(new Set(names.filter((n) => n))).sort((a, b) =>
      a.localeCompare(b)
    );
  }, [articles]);

  const filteredAndSorted = useMemo(() => {
    let result = articles.filter((article) => {
      const date = new Date(article.submitted_at);
      if (filterFrom && date < new Date(filterFrom)) return false;
      if (filterTo) {
        const to = new Date(filterTo);
        to.setHours(23, 59, 59, 999);
        if (date > to) return false;
      }
      return true;
    });
    if (filterCategory) {
      result = result.filter(
        (article) => article.category_name === filterCategory
      );
    }
    if (sortOrder === "asc") {
      result.sort(
        (a, b) => new Date(a.submitted_at) - new Date(b.submitted_at)
      );
    } else if (sortOrder === "desc") {
      result.sort(
        (a, b) => new Date(b.submitted_at) - new Date(a.submitted_at)
      );
    }
    if (sortCategory === "asc") {
      result.sort((a, b) => a.category_name.localeCompare(b.category_name));
    } else if (sortCategory === "desc") {
      result.sort((a, b) => b.category_name.localeCompare(a.category_name));
    }
    return result;
  }, [
    articles,
    filterFrom,
    filterTo,
    filterCategory,
    sortOrder,
    sortCategory,
  ]);

  const toggleExpand = (id) =>
    setExpandedArticles((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleAction = async (id, action, reason = "") => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "/articles/review",
        { article_id: id, action, reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(
        action === "Approved"
          ? "✅ Article approved!"
          : action === "Rejected"
          ? "🚫 Article rejected."
          : "✏️ Sent back for revision."
      );
      fetchPendingArticles();
    } catch (err) {
      console.error(`Failed to ${action}:`, err);
      toast.error(
        `Couldn’t ${action.toLowerCase()}. Please try again.`
      );
    }
  };

  const openReasonModal = (articleId, action) =>
    setReasonModal({ show: true, articleId, action, reason: "" });
  const closeReasonModal = () =>
    setReasonModal({ show: false, articleId: null, action: "", reason: "" });
  const submitReason = () => {
    if (
      !reasonModal.reason &&
      (reasonModal.action === "Rejected" || reasonModal.action === "Returned")
    ) {
      toast.error("Please provide a reason first.");
      return;
    }
    handleAction(reasonModal.articleId, reasonModal.action, reasonModal.reason);
    closeReasonModal();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-xl text-gray-600 animate-pulse">
          Loading pending articles…
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-blue-50 to-white min-h-screen py-10 px-4">
      <div className="max-w-6xl mx-auto">
        {/* HEADER */}
        <h1 className="text-4xl lg:text-5xl font-extrabold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500 border-b-4 border-indigo-300 pb-3">
          Pending Articles for Review
        </h1>

        {/* FILTER & SORT */}
        <div className="flex flex-wrap items-end gap-6 mb-10">
          {/* Date From */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              From:
            </label>
            <input
              type="date"
              value={filterFrom}
              onChange={(e) => setFilterFrom(e.target.value)}
              className="mt-1 w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-300"
            />
          </div>
          {/* Date To */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              To:
            </label>
            <input
              type="date"
              value={filterTo}
              onChange={(e) => setFilterTo(e.target.value)}
              className="mt-1 w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-300"
            />
          </div>
          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Category:
            </label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="mt-1 w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-300"
            >
              <option value="">All Categories</option>
              {uniqueCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          {/* Sort Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Sort by Date:
            </label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="mt-1 w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-300"
            >
              <option value="">None</option>
              <option value="asc">Oldest First</option>
              <option value="desc">Newest First</option>
            </select>
          </div>
          {/* Sort Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Sort by Category:
            </label>
            <select
              value={sortCategory}
              onChange={(e) => setSortCategory(e.target.value)}
              className="mt-1 w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-300"
            >
              <option value="">None</option>
              <option value="asc">A → Z</option>
              <option value="desc">Z → A</option>
            </select>
          </div>
          <button
            onClick={() => {
              setFilterFrom("");
              setFilterTo("");
              setFilterCategory("");
              setSortOrder("");
              setSortCategory("");
            }}
            className="mt-6 px-5 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
          >
            Clear All
          </button>
        </div>

        {/* ARTICLES */}
        <div className="space-y-8">
          {filteredAndSorted.length === 0 ? (
            <div className="text-center text-gray-600 p-12 bg-white rounded-xl shadow-lg">
              <span className="text-5xl block mb-4">🎉</span>
              No pending articles to review.
            </div>
          ) : (
            filteredAndSorted.map((article) => {
              const isExpanded = !!expandedArticles[article.id];
              return (
                <div
                  key={article.id}
                  className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg hover:shadow-2xl transform hover:scale-[1.02] transition"
                >
                  {/* Meta */}
                  <h2 className="text-2xl font-semibold mb-2 transition-colors duration-300 hover:text-indigo-600">
                    {article.title}
                  </h2>
                  <div className="text-sm text-gray-500 mb-4 space-y-1">
                    <p>
                      <strong>Category:</strong> {article.category_name}
                    </p>
                    <p>
                      <strong>Submitted By:</strong>{" "}
                      {article.submitted_by_name || article.submitted_by}
                    </p>
                    <p>
                      <strong>At:</strong>{" "}
                      {new Date(article.submitted_at).toLocaleString()}
                    </p>
                  </div>

                  {/* Expand/Collapse */}
                  <button
                    onClick={() => toggleExpand(article.id)}
                    className={`mb-4 px-5 py-2 rounded-lg text-white font-medium shadow-sm transition ${
                      isExpanded
                        ? "bg-gray-300 text-gray-800 hover:bg-gray-400"
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    {isExpanded ? "Hide Article" : "Read Article"}
                  </button>

                  {/* Content */}
                  {isExpanded && (
                    <div className="text-gray-800 mb-6 leading-relaxed tracking-wide text-justify whitespace-pre-wrap">
                      {article.content}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-4 border-t border-gray-200 pt-4">
                    <button
                      onClick={() => handleAction(article.id, "Approved")}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg shadow-sm hover:bg-green-700 transform hover:-translate-y-0.5 transition"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() =>
                        openReasonModal(article.id, "Rejected")
                      }
                      className="px-6 py-2 bg-red-600 text-white rounded-lg shadow-sm hover:bg-red-700 transform hover:-translate-y-0.5 transition"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() =>
                        openReasonModal(article.id, "Returned")
                      }
                      className="px-6 py-2 bg-yellow-500 text-black rounded-lg shadow-sm hover:bg-yellow-600 transform hover:-translate-y-0.5 transition"
                    >
                      Return for Revision
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* REASON MODAL */}
      {reasonModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 shadow-2xl max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">
              Reason for “{reasonModal.action}”
            </h2>
            <textarea
              rows="4"
              className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-300 mb-4"
              placeholder="Enter reason…"
              value={reasonModal.reason}
              onChange={(e) =>
                setReasonModal((p) => ({ ...p, reason: e.target.value }))
              }
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={closeReasonModal}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={submitReason}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApproveArticles;
