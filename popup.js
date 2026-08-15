import {
  $,
  parseScheduleDateTime,
  formatScheduleDateTime,
  formatCountdown,
  padTimeInput,
  parseLegacyScheduleTime,
} from "./utils.js";

const submitBtn = $("#submit_btn");
const scheduleBtn = $("#schedule_btn");
const cancelScheduleBtn = $("#cancel_schedule_btn");
const textarea = $("textarea");
const scheduleDateInput = $("#schedule_date");
const scheduleHourInput = $("#schedule_hour");
const scheduleMinuteInput = $("#schedule_minute");
const scheduleSecondInput = $("#schedule_second");
const scheduleStatus = $("#schedule_status");

const timeInputs = [
  scheduleHourInput,
  scheduleMinuteInput,
  scheduleSecondInput,
];

const DKHP_URL_PATTERNS = [
  "https://dkhp.uit.edu.vn/*",
  "http://127.0.0.1:5173/*",
  "http://localhost:5173/*",
  "https://tool-dang-ky-hoc-phan-uit-new-web-test.vercel.app/*",
];

let countdownIntervalId = null;

function setScheduleStatus(message, type = "") {
  scheduleStatus.textContent = message;
  scheduleStatus.className = `schedule-status${type ? ` ${type}` : ""}`;
}

function clearCountdown() {
  if (countdownIntervalId !== null) {
    clearInterval(countdownIntervalId);
    countdownIntervalId = null;
  }
}

function notifyScheduleChange(type) {
  chrome.runtime.sendMessage({ type });

  chrome.tabs.query({ url: DKHP_URL_PATTERNS }, (tabs) => {
    for (const tab of tabs) {
      chrome.tabs.sendMessage(tab.id, { type }).catch(() => {});
    }
  });
}

function updateCountdown(scheduledAt) {
  clearCountdown();

  if (!scheduledAt || scheduledAt <= Date.now()) {
    setScheduleStatus("");
    return;
  }

  const tick = () => {
    const remaining = scheduledAt - Date.now();
    if (remaining <= 0) {
      setScheduleStatus("Đã đến giờ hẹn — đang đăng ký...", "success");
      clearCountdown();
      return;
    }

    setScheduleStatus(
      `Đã hẹn: ${formatScheduleDateTime(scheduledAt)} — còn ${formatCountdown(remaining)}`,
      "success"
    );
  };

  tick();
  countdownIntervalId = setInterval(tick, 1000);
}

function getScheduleDraft() {
  return {
    scheduleDate: scheduleDateInput.value,
    scheduleHour: scheduleHourInput.value.trim(),
    scheduleMinute: scheduleMinuteInput.value.trim(),
    scheduleSecond: scheduleSecondInput.value.trim(),
  };
}

function loadSavedData() {
  chrome.storage?.local?.get(
    [
      "subjects",
      "scheduleDate",
      "scheduleHour",
      "scheduleMinute",
      "scheduleSecond",
      "scheduleTime",
      "scheduledAt",
    ],
    (result) => {
      if (result?.subjects) {
        textarea.value = result.subjects;
      }
      if (result?.scheduleDate) {
        scheduleDateInput.value = result.scheduleDate;
      }

      if (result?.scheduleHour !== undefined) {
        scheduleHourInput.value = result.scheduleHour;
        scheduleMinuteInput.value = result.scheduleMinute || "";
        scheduleSecondInput.value = result.scheduleSecond || "";
      } else if (result?.scheduleTime) {
        const legacyTime = parseLegacyScheduleTime(result.scheduleTime);
        if (legacyTime) {
          scheduleHourInput.value = legacyTime.hour;
          scheduleMinuteInput.value = legacyTime.minute;
          scheduleSecondInput.value = legacyTime.second;
        }
      }

      if (result?.scheduledAt && result.scheduledAt > Date.now()) {
        updateCountdown(result.scheduledAt);
      } else if (result?.scheduledAt) {
        chrome.storage.local.remove(["scheduledAt"]);
        setScheduleStatus("");
      }
    }
  );
}

function saveDraftSchedule() {
  chrome.storage?.local?.set(getScheduleDraft());
}

function normalizeTimeInput(input) {
  input.value = input.value.replace(/\D/g, "").slice(0, 2);
}

function padTimeInputOnBlur(input) {
  if (input.value === "") return;
  input.value = padTimeInput(input.value);
}

function registerNow() {
  if (textarea.value === "") {
    alert("Bạn chưa nhập môn học");
    return;
  }

  const subjects = textarea.value;
  chrome.tabs?.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];
    chrome.tabs.sendMessage(activeTab.id, {
      type: "REGISTER",
      subjects,
    });
  });
}

function scheduleRegistration() {
  if (textarea.value === "") {
    alert("Bạn chưa nhập môn học");
    return;
  }

  timeInputs.forEach(padTimeInputOnBlur);

  const validation = parseScheduleDateTime(
    scheduleDateInput.value,
    scheduleHourInput.value,
    scheduleMinuteInput.value,
    scheduleSecondInput.value
  );

  if (!validation.valid) {
    setScheduleStatus(validation.error, "error");
    return;
  }

  if (validation.optional) {
    setScheduleStatus(
      "Vui lòng nhập đầy đủ ngày, giờ, phút và giây để hẹn đăng ký tự động.",
      "error"
    );
    return;
  }

  const draft = getScheduleDraft();

  chrome.storage.local.set(
    {
      subjects: textarea.value,
      ...draft,
      scheduledAt: validation.scheduledAt,
    },
    () => {
      updateCountdown(validation.scheduledAt);
      notifyScheduleChange("SETUP_SCHEDULE");
      setScheduleStatus(
        `Đã hẹn đăng ký lúc ${formatScheduleDateTime(validation.scheduledAt)}. Mở tab đăng ký UIT và giữ tab đó mở.`,
        "success"
      );
    }
  );
}

function cancelSchedule() {
  clearCountdown();
  chrome.storage.local.remove(["scheduledAt"], () => {
    notifyScheduleChange("CANCEL_SCHEDULE");
    setScheduleStatus("Đã hủy hẹn giờ.", "");
  });
}

textarea.addEventListener("input", () => {
  chrome.storage?.local?.set({ subjects: textarea.value });
});

scheduleDateInput.addEventListener("change", saveDraftSchedule);

for (const input of timeInputs) {
  input.addEventListener("input", () => {
    normalizeTimeInput(input);
    saveDraftSchedule();
  });
  input.addEventListener("change", () => {
    padTimeInputOnBlur(input);
    saveDraftSchedule();
  });
}

submitBtn.addEventListener("click", registerNow);
scheduleBtn.addEventListener("click", scheduleRegistration);
cancelScheduleBtn.addEventListener("click", cancelSchedule);

loadSavedData();

const version = $("#version");
version.textContent = chrome.runtime?.getManifest().version || "0.1.0";

window.addEventListener("unload", clearCountdown);
