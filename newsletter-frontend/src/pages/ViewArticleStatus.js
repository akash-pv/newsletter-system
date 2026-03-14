// src/pages/ViewArticleStatus.js

import React, { useEffect, useState } from "react";
import axios from "axios";

const StatusBadge = ({ status }) => {
  let bgColor = "bg-gray-200 text-gray-700";
  if (status === "Approved") bgColor = "bg-green-100 text-green-800";
  if (status === "Pending")  bgColor = "bg-yellow-100 text-yellow-800";
  if (status === "Rejected") bgColor = "bg-red-100 text-red-800";

  return (
    <span className={`${bgColor} px-3 py-1 rounded-full text-sm font-semibold whitespace-nowrap`}>
      {status}
    </span>
  );
};

const ViewArticleStatus = () => {
  const [articles, setArticles]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [searchTerm, setSearchTerm]       = useState("");
  const [expandedArticles, setExpanded]   = useState({});
  const userName = localStorage.getItem("name") || "User";

  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const { data } = await axios.get(
          "http://localhost:5000/articles/user",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setArticles(data);
      } catch (error) {
        console.error("Error fetching article status:", error);
        setArticles([]);
      } finally {
        setLoading(false);
      }
    };
    fetchArticles();
  }, []);

  const toggleExpand = (id) => {
    setExpanded((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const filteredArticles = articles.filter((article) =>
    article.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-purple-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-purple-700">
            Article Submission Status
          </h1>
          <p className="mt-2 text-gray-700">
            Hello <strong>{userName}</strong>, here’s the status of your articles:
          </p>
        </div>

        {/* Search */}
        <div className="mb-6 flex justify-center">
          <div className="relative w-full max-w-md">
            <input
              type="text"
              placeholder="Search by title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-purple-300 bg-white rounded-full py-2 pl-10 pr-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1112 4.5a7.5 7.5 0 014.65 12.15z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white shadow-lg rounded-2xl overflow-hidden">
          {loading ? (
            <div className="py-10 flex justify-center">
              <svg className="animate-spin h-8 w-8 text-purple-500" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            </div>
          ) : (
            <table className="table-fixed w-full divide-y divide-purple-200">
              <thead className="bg-purple-100">
                <tr>
                  <th className="w-2/5 px-4 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">Title</th>
                  <th className="w-1/5 px-4 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">Submitted On</th>
                  <th className="w-1/5 px-4 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">Status</th>
                  <th className="w-1/5 px-4 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">Remarks</th>
                  <th className="w-1/5 px-4 py-3 text-right text-xs font-medium text-purple-700 uppercase tracking-wider">View</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-purple-200">
                {filteredArticles.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      {articles.length === 0
                        ? "No articles submitted yet."
                        : "No articles match your search."}
                    </td>
                  </tr>
                ) : (
                  filteredArticles.map((article, idx) => (
                    <React.Fragment key={article.id}>
                      <tr className={idx % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                        <td className="px-4 py-4 text-sm font-medium text-gray-800 truncate max-w-xs">{article.title}</td>
                        <td className="px-4 py-4 text-sm text-gray-600">
                          {new Date(article.submitted_at).toLocaleString([], {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <StatusBadge status={article.status} />
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-700 truncate max-w-xs">{article.remarks || "—"}</td>
                        <td className="px-4 py-4 text-right">
                          <button
                            onClick={() => toggleExpand(article.id)}
                            className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 transition"
                          >
                            {expandedArticles[article.id] ? "Hide" : "View"}
                          </button>
                        </td>
                      </tr>

                      {expandedArticles[article.id] && (
                        <tr className="bg-blue-50">
                          <td colSpan={5} className="px-6 py-4 text-sm text-gray-800 whitespace-pre-wrap text-justify leading-relaxed">
                            {article.content}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewArticleStatus;
