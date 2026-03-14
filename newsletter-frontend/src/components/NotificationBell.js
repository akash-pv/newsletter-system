// src/components/NotificationBell.js

import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { BellIcon, XMarkIcon, EyeIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { fetchNotifications, markNotificationRead } from "../api/notificationApi";

export default function NotificationBell() {
  const [open, setOpen]       = useState(false);
  const [notifs, setNotifs]   = useState([]);
  const [unread, setUnread]   = useState(0);
  const containerRef          = useRef();
  const navigate              = useNavigate();

  const loadNotifications = async () => {
    try {
      const { data } = await fetchNotifications();
      setNotifs(data);
      setUnread(data.filter(n => !n.is_read).length);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    }
  };

  useEffect(() => {
    if (open) {
      loadNotifications();
      // Mark unread as read
      notifs.filter(n => !n.is_read).forEach(n =>
        markNotificationRead(n.id).catch(console.error)
      );
      setUnread(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Close when clicking outside
  useEffect(() => {
    const onClickOutside = e => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  // Remove a notification from view and fire a toast
  const handleRemove = id => {
    setNotifs(prev => prev.filter(n => n.id !== id));
    toast.success("Notification dismissed");
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Bell */}
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 transition focus:outline-none focus:ring-2 focus:ring-white"
      >
        <BellIcon className="h-6 w-6 text-white" />
        {unread > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold text-red-100 bg-red-600 rounded-full">
            {unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-md shadow-lg border border-gray-200 z-50">
          {/* Header */}
          <div className="px-4 py-2 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <span className="font-semibold text-gray-700">Notifications</span>
            <span className="text-sm text-gray-500">{notifs.length} total</span>
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto">
            {notifs.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                No notifications
              </div>
            ) : (
              notifs.map(n => {
                let submitter = "";
                let msgBody = n.message;
                const byIdx = n.message.lastIndexOf(" by ");
                if (byIdx > 0) {
                  msgBody = n.message.slice(0, byIdx + 1);
                  submitter = n.message.slice(byIdx + 4);
                }
                return (
                  <div
                    key={n.id}
                    className={`flex justify-between items-start px-4 py-3 border-b last:border-b-0 ${
                      n.is_read ? "bg-white" : "bg-blue-50"
                    } hover:bg-gray-100`}
                  >
                    {/* Content */}
                    <div className="flex-1 pr-4">
                      {submitter && (
                        <p className="text-sm font-medium text-gray-800">
                          {submitter}
                        </p>
                      )}
                      <p className="text-sm text-gray-700 mt-1">
                        {msgBody}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(n.created_at).toLocaleString()}
                      </p>

                      {/* View button with eye icon */}
                      <button
                        onClick={() => {
                          navigate("/approve");
                          setOpen(false);
                        }}
                        className="mt-2 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
                      >
                        <EyeIcon className="h-4 w-4 mr-1" />
                        View
                      </button>
                    </div>

                    {/* Remove icon */}
                    <button
                      onClick={() => handleRemove(n.id)}
                      className="ml-2 text-gray-400 hover:text-gray-600"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
