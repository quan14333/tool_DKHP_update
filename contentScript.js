const successLog = (message) =>
  console.log("%c" + message, "font-weight:bold; color:green;");
const errorLog = (message) =>
  console.log("%c" + message, "font-weight:bold; color:red;");

let scheduleTimerId = null;

chrome.runtime.onMessage.addListener((obj) => {
  const { type, subjects } = obj;

  if (type === "REGISTER") {
    registerSubjects(subjects);
  }

  if (type === "SETUP_SCHEDULE") {
    setupScheduleTimer();
  }

  if (type === "CANCEL_SCHEDULE") {
    clearScheduleTimer();
  }
});

function clearScheduleTimer() {
  if (scheduleTimerId !== null) {
    clearTimeout(scheduleTimerId);
    scheduleTimerId = null;
  }
}

function setupScheduleTimer() {
  clearScheduleTimer();

  chrome.storage.local.get(["scheduledAt", "subjects"], (result) => {
    const { scheduledAt, subjects } = result;
    if (!scheduledAt || !subjects) return;

    const delay = scheduledAt - Date.now();
    if (delay <= 0) return;

    const scheduledLabel = new Date(scheduledAt).toLocaleString("vi-VN");
    successLog(
      `Đã hẹn đăng ký lúc ${scheduledLabel}. Giữ tab này mở để đăng ký chính xác.`
    );

    scheduleTimerId = setTimeout(() => {
      scheduleTimerId = null;
      chrome.storage.local.get(["scheduledAt", "subjects"], (result) => {
        if (!result.scheduledAt || !result.subjects) return;

        chrome.storage.local.remove(["scheduledAt"], () => {
          successLog("Đến giờ hẹn — bắt đầu đăng ký tự động!");
          registerSubjects(result.subjects);
        });
      });
    }, delay);
  });
}

function registerSubjects(subjects) {
  DangKy(subjects);
  Duyet();
}

function DangKy(monDangKyString) {
  try {
    var listMonDangKy = monDangKyString
      .trim()
      .split(/[\n,]+/)
      .map((it) => it.trim())
      .filter((it) => it !== "");

    var allRows = [...document.querySelectorAll("table > tbody > tr")];

    var rowsToDangKy = allRows.filter((it) =>
      listMonDangKy.includes(
        it.querySelector("td:nth-child(2)")?.textContent?.trim()
      )
    );

    rowsToDangKy.forEach((it, index) => {
      it.querySelector('td:first-child input[type="checkbox"]').click();
      var tenLop = it.querySelector("td:nth-child(2)")?.textContent?.trim();
      successLog(index + 1 + ".Đã chọn lớp " + tenLop);
    });
  } catch {
    errorLog("Chọn lớp không thành công! Bạn tự chọn lớp đi nhé!");
  }
}

function Duyet() {
  const button =
    document.querySelector('button[class*="chakra-button css-kyhdse"]') ||
    document.querySelector('button[class*="chakra-button css-14qea61"]') ||
    Array.from(
      document.querySelectorAll('button[class*="chakra-button"]')
    ).pop();
  if (!button) return;
  button.click();
}

setupScheduleTimer();
