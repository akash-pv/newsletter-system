// src/pages/PendingApprovalDashboard.js

import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

export default function PendingApprovalDashboard() {
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        "http://localhost:5000/admin/api/pending-users",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setUsers(res.data);
    } catch (error) {
      console.error("Failed to fetch pending users:", error);
      toast.error("❌ Failed to fetch pending users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleApprove = async (id) => {
    try {
      await axios.patch(
        `http://localhost:5000/admin/api/approve/${id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      toast.success("✅ User approved.");
      fetchUsers();
    } catch (error) {
      console.error("Failed to approve user:", error);
      toast.error("❌ Failed to approve user.");
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm("Reject and delete this user?")) return;

    try {
      await axios.delete(
        `http://localhost:5000/admin/api/reject/${id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      toast.success("✅ User rejected and deleted.");
      fetchUsers();
    } catch (error) {
      console.error("Failed to reject user:", error);
      toast.error("❌ Failed to reject user.");
    }
  };

  return (
    <div className="min-h-screen flex items-start justify-center bg-gray-100 py-12 px-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-blue-600 px-6 py-4">
          <h2 className="text-2xl font-bold text-white text-center">
            Pending User Approvals
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading users…</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-gray-600">
            No pending users.
          </div>
        ) : (
          <table className="w-full table-auto">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                  Role
                </th>
                <th className="px-6 py-3 text-center text-sm font-medium text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, idx) => {
                const initial =
                  user.full_name?.charAt(0).toUpperCase() || "?";
                return (
                  <tr
                    key={user.id}
                    className={
                      idx % 2 === 0
                        ? "bg-white hover:bg-gray-50"
                        : "bg-gray-50 hover:bg-gray-100"
                    }
                  >
                    <td className="px-6 py-4 flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-blue-200 text-blue-700 flex items-center justify-center text-lg font-semibold">
                        {initial}
                      </div>
                      <span className="text-gray-800 font-medium">
                        {user.full_name}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{user.email}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {user.role_name}
                    </td>
                    <td className="px-6 py-4 text-center space-x-2">
                      <button
                        onClick={() => handleApprove(user.id)}
                        className="px-4 py-1 bg-green-500 hover:bg-green-600 text-white rounded-lg transition"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(user.id)}
                        className="px-4 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg transition"
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
