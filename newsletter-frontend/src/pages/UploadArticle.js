// src/pages/UploadArticle.js

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";

const UploadArticle = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.size > 5 * 1024 * 1024) {
      toast.error("File size should be less than 5 MB");
      return;
    }
    setFile(selectedFile);
  };

  const generateContent = async () => {
    if (!title.trim()) {
      toast.error("Please enter a title first.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await axios.post("http://localhost:11434/api/generate", {
        model: "mistral:instruct",
        prompt: `Write a short article about "${title}" in maximum 150`,
        stream: false,
      });
      setContent(data.response);
      toast.success("Content generated!");
    } catch (err) {
      console.error("Ollama Mistral error:", err);
      toast.error(
        `Failed to generate content. ${err.response?.data?.error || err.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim() || !content.trim() || !category) {
      toast.error("Please fill all required fields.");
      return;
    }
    if (!file) {
      toast.error("Please upload an image.");
      return;
    }

    const categoryMap = {
      ProductUpdate: 1,
      CustomerGoLive: 2,
      NewProductRelease: 3,
      BusinessUpdate: 4,
      HRDomainKnowledge: 5,
    };
    const categoryId = categoryMap[category];
    if (!categoryId) {
      toast.error("Please select a valid category.");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);
    formData.append("category_id", categoryId);
    formData.append("file", file);

    setLoading(true);
    try {
      const response = await axios.post(
        "http://localhost:5000/articles/submit",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (
        response.status === 201 ||
        response.data?.message === "Article submitted successfully"
      ) {
        toast.success("✅ Article uploaded successfully!");
        navigate("/dashboard");
      } else {
        console.warn("Unexpected submit response:", response);
        toast("Upload completed, but with an unexpected response.", {
          icon: "❗",
        });
      }
    } catch (error) {
      console.error("Error uploading article:", error);
      toast.error(
        `Upload failed. ${error.response?.data?.message || error.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div
        className={`mx-auto ${
          showPreview
            ? "flex h-screen w-full max-w-5xl gap-8 px-4 py-4"
            : "w-full max-w-3xl px-4 py-10"
        }`}
      >
        {/* LEFT COLUMN: FORM */}
        <div
          className={`bg-white rounded-2xl shadow-lg p-8 ${
            showPreview
              ? "w-full md:w-1/2 h-full overflow-y-auto"
              : "w-full"
          }`}
        >
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-blue-600">
              Upload Article
            </h2>
            <button
              onClick={() => setShowPreview((v) => !v)}
              className="inline-flex items-center px-4 py-2 text-blue-600 bg-blue-100 rounded-lg hover:bg-blue-200 focus:ring-2 focus:ring-blue-300 transition"
            >
              {showPreview ? "Hide Preview" : "Show Preview"}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Title *
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter article title"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
              />
            </div>

            {/* Auto-Generate */}
            <div>
              <button
                type="button"
                onClick={generateContent}
                disabled={loading}
                className={`w-full flex justify-center items-center px-4 py-3 text-white rounded-xl shadow-md transition ${
                  loading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-green-500 hover:bg-green-600 focus:ring-2 focus:ring-green-400"
                }`}
              >
                {loading && (
                  <svg
                    className="animate-spin h-5 w-5 mr-2 text-white"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    />
                  </svg>
                )}
                {loading ? "Generating..." : "Auto-Generate Content with AI"}
              </button>
            </div>

            {/* Content */}
            <div>
              <label
                htmlFor="content"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Content *
              </label>
              <textarea
                id="content"
                rows={6}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Article content"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
              />
            </div>

            {/* Category */}
            <div>
              <label
                htmlFor="category"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Category *
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
              >
                <option value="">Select Category</option>
                <option value="ProductUpdate">Product Update</option>
                <option value="CustomerGoLive">Customer GoLive</option>
                <option value="NewProductRelease">New Product Release</option>
                <option value="BusinessUpdate">Business Update</option>
                <option value="HRDomainKnowledge">HR Domain Knowledge</option>
              </select>
            </div>

            {/* File Upload */}
            <div>
              <label
                htmlFor="file"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Upload Image *
              </label>
              <div className="flex items-center">
                <label
                  htmlFor="file"
                  className="inline-flex items-center px-4 py-3 bg-white text-gray-600 border border-gray-300 rounded-xl shadow-sm cursor-pointer hover:bg-gray-50 transition"
                >
                  Choose File
                </label>
                <input
                  id="file"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="sr-only"
                />
                <span className="ml-3 text-gray-500 truncate">
                  {file ? file.name : "No file chosen"}
                </span>
              </div>
            </div>

            {/* Submit */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center px-4 py-3 bg-blue-600 text-white rounded-xl shadow-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 transition"
              >
                Submit Article
              </button>
            </div>
          </form>
        </div>

        {/* RIGHT COLUMN: PREVIEW */}
        {showPreview && (
          <div className="w-full md:w-1/2 h-full overflow-y-auto bg-white rounded-2xl shadow-lg p-8">
            {category && (
              <span className="inline-block bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-1 rounded-full mb-4">
                {category === "ProductUpdate"
                  ? "Product Update"
                  : category === "CustomerGoLive"
                  ? "Customer GoLive"
                  : category === "NewProductRelease"
                  ? "New Product Release"
                  : category === "BusinessUpdate"
                  ? "Business Update"
                  : "HR Domain Knowledge"}
              </span>
            )}

            <h1 className="text-4xl font-bold text-gray-900 mb-6">
              {title || "No Title"}
            </h1>

            {file && (
              <div className="mb-6 h-64 bg-gray-200 flex items-center justify-center overflow-hidden rounded-lg">
                <img
                  src={URL.createObjectURL(file)}
                  alt="Preview"
                  className="object-cover w-full h-full"
                />
              </div>
            )}

            <div className="prose prose-lg max-w-none text-gray-800 text-justify">
              {content
                ? content.split("\n").map((line, idx) => <p key={idx}>{line}</p>)
                : "No content yet."}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadArticle;
