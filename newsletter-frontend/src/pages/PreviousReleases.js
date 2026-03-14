// src/pages/PreviousReleases.js

import React, { useEffect, useState } from "react";
import axios from "axios";

// Simple Modal component defined in the same file
const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl p-6 w-full max-w-lg mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

const PreviousReleases = () => {
  const [newsletters, setNewsletters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal-related state:
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNewsletter, setSelectedNewsletter] = useState(null);

  // Email form fields:
  const [recipients, setRecipients] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [sendSuccess, setSendSuccess] = useState("");

  useEffect(() => {
    fetchNewsletters();
  }, []);

  const fetchNewsletters = async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Authentication token not found. Please log in.");
        setLoading(false);
        return;
      }

      const response = await axios.get("http://localhost:5000/newsletter", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setNewsletters(response.data);
    } catch (err) {
      console.error("Error fetching newsletters:", err);
      if (err.response && err.response.status === 404) {
        setError("❌ Endpoint not found. Please check the API URL.");
      } else if (err.response && err.response.status === 401) {
        setError("🔒 Unauthorized. Please log in again.");
      } else {
        setError("⚠️ Failed to fetch newsletters. Please try again later.");
      }
      setNewsletters([]);
    } finally {
      setLoading(false);
    }
  };

  // Open the modal and pre-fill email fields
  const openEmailModal = (newsletter) => {
    setSelectedNewsletter(newsletter);
    setSendError("");
    setSendSuccess("");

    // Pre-fill subject & body
    setSubject(`[ZINGUPDATE] ${newsletter.title}`);
    setBody(
      `Hello team,\n\nPlease find our latest ZINGUPDATE newsletter titled "${newsletter.title}" attached. You can download it directly from the link below:\n\n` +
      `http://localhost:5000/newsletter/download/${newsletter.pdf_file}\n\n` +
      `Feel free to share feedback or questions.\n\nBest regards,\nZingHR Communications`
    );

    setRecipients(""); // clear recipients
    setIsModalOpen(true);
  };

  // Send email request
  const sendEmail = async () => {
    setSending(true);
    setSendError("");
    setSendSuccess("");

    if (!recipients.trim()) {
      setSendError("Please enter at least one recipient email.");
      setSending(false);
      return;
    }

    // Split comma-separated list
    const recipientList = recipients
      .split(",")
      .map((r) => r.trim())
      .filter((r) => r.length > 0);

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token.");

      await axios.post(
        "http://localhost:5000/newsletter/email",
        {
          newsletterId: selectedNewsletter.id,
          pdfFile: selectedNewsletter.pdf_file,
          recipients: recipientList,
          subject,
          body,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSendSuccess("✅ Email sent successfully!");
    } catch (err) {
      console.error("Error sending email:", err);
      setSendError("❌ Failed to send email. Please try again.");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center mt-10 text-xl text-gray-700">
        Loading previous releases...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center mt-10 text-xl text-red-500 bg-red-100 p-4 rounded-md">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-100 p-4 sm:p-6">
      <div className="w-full max-w-4xl">
        <h2 className="text-3xl font-bold mb-8 text-center text-gray-800">
          Previous Newsletter Releases
        </h2>

        {newsletters.length > 0 ? (
          <div className="space-y-6">
            {newsletters.map((newsletter) => (
              <div
                key={newsletter.id}
                className="bg-white p-6 shadow-lg rounded-xl border border-gray-200 hover:shadow-xl transition-shadow duration-300 ease-in-out"
              >
                {/* Title & Meta */}
                <h3 className="text-xl font-semibold text-blue-700 mb-2">
                  {newsletter.title}
                </h3>
                <p className="text-sm text-gray-500 mb-3">
                  Published on:{" "}
                  {new Date(newsletter.published_date).toLocaleDateString(
                    "en-US",
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )}
                </p>

                <div className="flex space-x-3">
                  {/* Download PDF Button */}
                  <a
                    href={`http://localhost:5000/newsletter/download/${newsletter.pdf_file}`}
                    download
                    className="px-5 py-2 bg-green-600 text-white text-sm font-medium rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition duration-150 ease-in-out"
                  >
                    Download PDF
                  </a>

                  {/* Email Newsletter Button */}
                  <button
                    onClick={() => openEmailModal(newsletter)}
                    className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-150 ease-in-out"
                  >
                    Email Newsletter
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-600 bg-white p-10 rounded-lg shadow">
            <span className="text-4xl block mb-4">🗂️</span>
            No previous newsletters found.
          </div>
        )}
      </div>

      {/* ----- Email Modal ----- */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <h3 className="text-xl font-semibold mb-4 text-gray-800">
          Email: {selectedNewsletter?.title}
        </h3>

        <div className="space-y-4">
          {/* Recipients */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recipients (comma-separated emails)
            </label>
            <textarea
              value={recipients}
              onChange={(e) => setRecipients(e.target.value)}
              rows={2}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="alice@example.com, bob@example.com"
            />
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Body */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Body
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Error / Success Messages */}
        {sendError && (
          <p className="text-sm text-red-600 mt-2">{sendError}</p>
        )}
        {sendSuccess && (
          <p className="text-sm text-green-600 mt-2">{sendSuccess}</p>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={() => setIsModalOpen(false)}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Cancel
          </button>
          <button
            onClick={sendEmail}
            disabled={sending}
            className={`px-4 py-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition ${
              sending
                ? "bg-blue-300 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {sending ? "Sending…" : "Send Email"}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default PreviousReleases;
