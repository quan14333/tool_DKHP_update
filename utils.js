export const $ = (selector) => document.querySelector(selector);
export const $$ = (selector) => document.querySelectorAll(selector);

function parseTimePart(value, label, min, max) {
  if (value === "") {
    return { valid: false, error: `Vui lòng nhập ${label}.` };
  }

  if (!/^\d{1,2}$/.test(value)) {
    return { valid: false, error: `${label} không hợp lệ.` };
  }

  const number = Number(value);
  if (!Number.isInteger(number) || number < min || number > max) {
    return {
      valid: false,
      error: `${label} phải từ ${String(min).padStart(2, "0")} đến ${String(max).padStart(2, "0")}.`,
    };
  }

  return { valid: true, value: number };
}

export function parseScheduleDateTime(dateStr, hourStr, minuteStr, secondStr) {
  const hasDate = Boolean(dateStr);
  const hasHour = hourStr !== "";
  const hasMinute = minuteStr !== "";
  const hasSecond = secondStr !== "";
  const hasAnyTime = hasHour || hasMinute || hasSecond;
  const hasAllTime = hasHour && hasMinute && hasSecond;

  if (!hasDate && !hasAnyTime) {
    return { valid: true, optional: true };
  }

  if (!hasDate || !hasAllTime) {
    return {
      valid: false,
      error:
        "Vui lòng nhập đầy đủ ngày, giờ, phút và giây, hoặc để trống cả phần hẹn giờ.",
    };
  }

  const dateMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!dateMatch) {
    return { valid: false, error: "Ngày không hợp lệ." };
  }

  const hourResult = parseTimePart(hourStr, "Giờ", 0, 23);
  if (!hourResult.valid) return hourResult;

  const minuteResult = parseTimePart(minuteStr, "Phút", 0, 59);
  if (!minuteResult.valid) return minuteResult;

  const secondResult = parseTimePart(secondStr, "Giây", 0, 59);
  if (!secondResult.valid) return secondResult;

  const year = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const day = Number(dateMatch[3]);
  const hour = hourResult.value;
  const minute = minuteResult.value;
  const second = secondResult.value;

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
  const date = new Date(timestamp);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  const second = String(date.getSeconds()).padStart(2, "0");

  return `${day}/${month}/${year} ${hour}:${minute}:${second}`;
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

export function padTimeInput(value) {
  if (value === "") return "";
  return String(Number(value)).padStart(2, "0");
}

export function parseLegacyScheduleTime(timeStr) {
  if (!timeStr) return null;

  const match = timeStr.match(/^(\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) return null;

  return {
    hour: match[1],
    minute: match[2],
    second: match[3] || "00",
  };
}
