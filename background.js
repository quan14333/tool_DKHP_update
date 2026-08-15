const ALARM_NAME = "scheduled-register";

const DKHP_URL_PATTERNS = [
  "https://dkhp.uit.edu.vn/*",
  "http://127.0.0.1:5173/*",
  "http://localhost:5173/*",
  "https://tool-dang-ky-hoc-phan-uit-new-web-test.vercel.app/*",
];

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "SETUP_SCHEDULE") {
    setupAlarm();
  }
  if (msg.type === "CANCEL_SCHEDULE") {
    chrome.alarms.clear(ALARM_NAME);
  }
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) {
    triggerRegistration();
  }
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local" || !changes.scheduledAt) return;
  if (changes.scheduledAt.newValue) {
    setupAlarm();
  } else {
    chrome.alarms.clear(ALARM_NAME);
  }
});

function setupAlarm() {
  chrome.storage.local.get(["scheduledAt"], (result) => {
    const { scheduledAt } = result;
    if (!scheduledAt || scheduledAt <= Date.now()) {
      chrome.alarms.clear(ALARM_NAME);
      return;
    }
    chrome.alarms.clear(ALARM_NAME, () => {
      chrome.alarms.create(ALARM_NAME, { when: scheduledAt });
    });
  });
}

function triggerRegistration() {
  chrome.storage.local.get(["subjects", "scheduledAt"], (result) => {
    const { subjects, scheduledAt } = result;
    if (!subjects || !scheduledAt) return;

    chrome.storage.local.remove(["scheduledAt"], () => {
      chrome.tabs.query({ url: DKHP_URL_PATTERNS }, (tabs) => {
        for (const tab of tabs) {
          chrome.tabs
            .sendMessage(tab.id, { type: "REGISTER", subjects })
            .catch(() => {});
        }
      });
    });
  });
}

// Restore alarm when service worker wakes up
setupAlarm();
