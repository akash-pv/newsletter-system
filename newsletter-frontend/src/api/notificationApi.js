// src/api/notificationApi.js

import axiosInstance from "./axiosInstance";

/**
 * Fetch up to 50 of the most recent notifications for the current user.
 * @returns {Promise<import("axios").AxiosResponse<Notification[]>>}
 */
export const fetchNotifications = () =>
  axiosInstance.get("/api/notifications");

/**
 * Mark a single notification as read.
 * @param {number|string} id  Notification ID
 * @returns {Promise<import("axios").AxiosResponse>}
 */
export const markNotificationRead = (id) =>
  axiosInstance.patch(`/api/notifications/${id}/read`);
