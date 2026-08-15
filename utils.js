export const $ = (selector) => document.querySelector(selector);
export const $$ = (selector) => document.querySelectorAll(selector);

export function parseScheduleDateTime(dateStr, timeStr) {
  if (!dateStr && !timeStr) {
    return { valid: true, optional: true };
  }

  if (!dateStr || !timeStr) {
    return {
      valid: false,
      error: "Vui lòng nhập đầy đủ ngày và giờ, hoặc để trống cả hai.",
    };
  }

  const dateMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!dateMatch) {
    return { valid: false, error: "Ngày không hợp lệ." };
  }

  const timeMatch = timeStr.match(/^(\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (!timeMatch) {
    return { valid: false, error: "Giờ không hợp lệ." };
  }

  const year = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const day = Number(dateMatch[3]);
  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);
  const second = Number(timeMatch[3] || 0);

  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31 ||
    hour > 23 ||
    minute > 59 ||
    second > 59
  ) {
    return { valid: false, error: "Ngày giờ không hợp lệ." };
  }

  const scheduledAt = new Date(
    year,
    month - 1,
    day,
    hour,
    minute,
    second,
    0
  ).getTime();

  if (Number.isNaN(scheduledAt)) {
    return { valid: false, error: "Ngày giờ không hợp lệ." };
  }

  const verifyDate = new Date(scheduledAt);
  if (
    verifyDate.getFullYear() !== year ||
    verifyDate.getMonth() !== month - 1 ||
    verifyDate.getDate() !== day ||
    verifyDate.getHours() !== hour ||
    verifyDate.getMinutes() !== minute ||
    verifyDate.getSeconds() !== second
  ) {
    return { valid: false, error: "Ngày giờ không hợp lệ." };
  }

  if (scheduledAt <= Date.now()) {
    return { valid: false, error: "Thời gian hẹn phải ở tương lai." };
  }

  return { valid: true, scheduledAt, optional: false };
}

export function formatScheduleDateTime(timestamp) {
  return new Date(timestamp).toLocaleString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function formatCountdown(ms) {
  if (ms <= 0) return "00:00:00";

  const totalSeconds = Math.ceil(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}
