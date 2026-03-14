// src/pages/FAQPage.js

import React, { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";

// Define a constant for the base URL
const API_BASE_URL = "http://localhost:5000/api";

const FAQPage = () => {
  const [faqs, setFaqs] = useState([]);
  const [newFAQ, setNewFAQ] = useState({ question: "", answer: "" });
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const role = localStorage.getItem("role");

  // Refs for auto-resizing textareas
  const addAnswerTextareaRef = useRef(null);
  const editAnswerTextareaRef = useRef(null);

  // Auto-resize helper
  const autoResizeTextarea = useCallback((el) => {
    if (el) {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }
  }, []);

  // Fetch FAQs
  const fetchFAQs = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/faqs`);
      setFaqs(res.data);
    } catch (err) {
      console.error("Error fetching FAQs:", err);
      toast.error("Failed to load FAQs. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFAQs();
  }, [fetchFAQs]);

  const handleInputChange = (e, field) => {
    setNewFAQ((prev) => ({ ...prev, [field]: e.target.value }));
    if (field === "answer") {
      const ref = editingId ? editAnswerTextareaRef.current : addAnswerTextareaRef.current;
      autoResizeTextarea(ref);
    }
  };

  // Add FAQ
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newFAQ.question.trim() || !newFAQ.answer.trim()) {
      toast.error("Question and answer cannot be empty.");
      return;
    }
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API_BASE_URL}/faqs`, newFAQ, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("FAQ added successfully!");
      setNewFAQ({ question: "", answer: "" });
      if (addAnswerTextareaRef.current) autoResizeTextarea(addAnswerTextareaRef.current);
      fetchFAQs();
    } catch (err) {
      console.error("Error adding FAQ:", err);
      toast.error(
        err.response?.data?.message || "Error adding FAQ. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Enter edit mode
  const handleEdit = (faq) => {
    setEditingId(faq.id);
    setNewFAQ({ question: faq.question, answer: faq.answer });
    setTimeout(() => {
      if (editAnswerTextareaRef.current) {
        autoResizeTextarea(editAnswerTextareaRef.current);
      }
    }, 0);
  };

  // Update FAQ
  const handleUpdate = async (id) => {
    if (!newFAQ.question.trim() || !newFAQ.answer.trim()) {
      toast.error("Question and answer cannot be empty.");
      return;
    }
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${API_BASE_URL}/faqs/${id}`, newFAQ, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("FAQ updated successfully!");
      setEditingId(null);
      setNewFAQ({ question: "", answer: "" });
      fetchFAQs();
    } catch (err) {
      console.error("Error updating FAQ:", err);
      toast.error(
        err.response?.data?.message || "Error updating FAQ. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Delete FAQ
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this FAQ?")) return;
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_BASE_URL}/faqs/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("FAQ deleted successfully!");
      fetchFAQs();
    } catch (err) {
      console.error("Error deleting FAQ:", err);
      toast.error(
        err.response?.data?.message || "Error deleting FAQ. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white p-4 sm:p-6 md:p-8">
      <div className="max-w-3xl mx-auto bg-white p-6 sm:p-8 rounded-xl shadow-2xl">
        <h1 className="text-3xl font-bold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-700 to-blue-600">
          Frequently Asked Questions
        </h1>

        {/* Add New FAQ Form - Only for Admin */}
        {role === "Admin" && (
          <div className="mb-10 p-6 border border-blue-200 rounded-lg shadow-md bg-blue-50/30">
            <h2 className="text-2xl font-semibold mb-4 text-blue-700">
              Add New FAQ
            </h2>
            <form onSubmit={handleAdd}>
              <input
                type="text"
                placeholder="Enter question here..."
                className="w-full border-gray-300 p-3 mb-3 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={newFAQ.question}
                onChange={(e) => handleInputChange(e, "question")}
                disabled={isLoading}
              />
              <textarea
                ref={addAnswerTextareaRef}
                placeholder="Enter answer here..."
                className="w-full border-gray-300 p-3 mb-4 rounded-md shadow-sm resize-none overflow-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={newFAQ.answer}
                onChange={(e) => handleInputChange(e, "answer")}
                rows={3}
                disabled={isLoading}
              />
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 rounded-md shadow-lg transform transition hover:scale-105"
                disabled={isLoading}
              >
                {isLoading ? "Adding..." : "Add FAQ"}
              </button>
            </form>
          </div>
        )}

        {/* FAQ List */}
        {isLoading && faqs.length === 0 && (
          <p className="text-center text-gray-500">Loading FAQs...</p>
        )}
        {faqs.length === 0 && !isLoading && (
          <p className="text-center text-gray-600 mt-8">
            No FAQs available at the moment.
          </p>
        )}

        <ul className="space-y-6">
          {faqs.map((faq) => (
            <li
              key={faq.id}
              className="border-gray-200 rounded-lg p-4 sm:p-6 shadow-lg bg-gray-50/50 hover:shadow-xl transition-shadow"
            >
              {editingId === faq.id ? (
                <div className="space-y-3">
                  <input
                    className="w-full border-gray-300 p-3 rounded-md shadow-sm focus:ring-2 focus:ring-green-500"
                    value={newFAQ.question}
                    onChange={(e) => handleInputChange(e, "question")}
                    disabled={isLoading}
                  />
                  <textarea
                    ref={editAnswerTextareaRef}
                    className="w-full border-gray-300 p-3 rounded-md shadow-sm resize-none overflow-hidden focus:ring-2 focus:ring-green-500"
                    value={newFAQ.answer}
                    onChange={(e) => handleInputChange(e, "answer")}
                    rows={3}
                    disabled={isLoading}
                  />
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => handleUpdate(faq.id)}
                      className="flex-1 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white py-2 rounded-md shadow-md transform transition hover:scale-105"
                      disabled={isLoading}
                    >
                      {isLoading ? "Saving..." : "Save"}
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(null);
                        setNewFAQ({ question: "", answer: "" });
                      }}
                      className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-md shadow-md transform transition hover:scale-105"
                      disabled={isLoading}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <details className="group">
                  <summary className="font-semibold text-lg text-gray-800 cursor-pointer flex justify-between items-center hover:text-blue-600 transition-colors">
                    {faq.question}
                    <span className="text-blue-500 group-open:rotate-90 transform transition-transform duration-200 ml-2">
                      &#10148;
                    </span>
                  </summary>
                  <p className="text-gray-700 mt-2 pt-2 border-t border-gray-200 whitespace-pre-line">
                    {faq.answer}
                  </p>

                  {role === "Admin" && (
                    <div className="mt-4 flex gap-3 border-t pt-3">
                      <button
                        onClick={() => handleEdit(faq)}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded-md shadow-sm transform transition hover:scale-105"
                        disabled={isLoading}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(faq.id)}
                        className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-md shadow-sm transform transition hover:scale-105"
                        disabled={isLoading}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </details>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default FAQPage;
