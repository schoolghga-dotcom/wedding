const weddingDate = new Date("2026-08-02T17:00:00+03:00").getTime();
const storageKey = "wedding-rsvp-responses-v1";
const adminPassword = "admin2026";
// Paste the Google Apps Script Web app URL ending with /exec here.
const sheetApiUrl = "https://script.google.com/macros/s/AKfycbxxjH-jp1KWCeIVVYjyyY6MBkzbb7N3jRMh_zfITuBoSDDR93AxOCPG5b-xpBOAMpA/exec";
const sheetApiToken = "admin2026";
const chartColors = ["#a87f67", "#7d9d89", "#d39b6a", "#7d88b7", "#d07f8a", "#9f8f80"];

const daysEl = document.getElementById("days");
const hoursEl = document.getElementById("hours");
const minutesEl = document.getElementById("minutes");
const secondsEl = document.getElementById("seconds");
const guestAuthForm = document.getElementById("guest-auth-form");
const authMessage = document.getElementById("auth-message");
const guestNameHidden = document.getElementById("guest-name-hidden");
const rsvpForm = document.getElementById("rsvp-form");
const formMessage = document.getElementById("form-message");
const attendanceSelect = document.getElementById("attendance-select");
const attendanceDetailFields = document.querySelectorAll(".attendance-detail-field");
const drinksSelect = document.getElementById("drinks-select");
const customDrinkWrap = document.getElementById("custom-drink-wrap");
const customDrinkInput = document.getElementById("custom-drink");
const adminLoginForm = document.getElementById("admin-login-form");
const adminMessage = document.getElementById("admin-message");
const adminDashboard = document.getElementById("admin-dashboard");
const totalResponsesEl = document.getElementById("total-responses");
const totalGuestsEl = document.getElementById("total-guests");
const responsesBody = document.getElementById("responses-body");
const statsRings = document.getElementById("stats-rings");
const deleteModal = document.getElementById("delete-modal");
const deleteText = document.getElementById("delete-text");
const cancelDeleteBtn = document.getElementById("cancel-delete-btn");
const confirmDeleteBtn = document.getElementById("confirm-delete-btn");
const bgMusic = document.getElementById("bg-music");
const volumeModal = document.getElementById("volume-modal");
const volumeSlider = document.getElementById("volume-slider");
const volumeValue = document.getElementById("volume-value");
const startMusicBtn = document.getElementById("start-music-btn");
const skipMusicBtn = document.getElementById("skip-music-btn");
const musicToggleBtn = document.getElementById("music-toggle-btn");
const volumeStorageKey = "wedding-bg-music-volume-v1";
let pendingDeleteGuest = "";
let musicStarted = false;

const DEFAULT_VOLUME = 0.2;

function initBackgroundMusic() {
  if (!bgMusic || !volumeSlider || !volumeValue) {
    return;
  }

  const savedVolume = localStorage.getItem(volumeStorageKey);
  const initialVolume = savedVolume !== null ? Number(savedVolume) : DEFAULT_VOLUME;
  const clampedVolume = Number.isFinite(initialVolume)
    ? Math.min(1, Math.max(0, initialVolume))
    : DEFAULT_VOLUME;

  bgMusic.volume = clampedVolume;
  bgMusic.loop = true;
  volumeSlider.value = String(Math.round(clampedVolume * 100));
  volumeValue.textContent = `${Math.round(clampedVolume * 100)}%`;

  volumeSlider.addEventListener("input", () => {
    const volume = Number(volumeSlider.value) / 100;
    bgMusic.volume = volume;
    volumeValue.textContent = `${volumeSlider.value}%`;
    localStorage.setItem(volumeStorageKey, String(volume));
  });

  startMusicBtn.addEventListener("click", async () => {
    if (musicStarted) {
      closeVolumeModal();
      return;
    }

    try {
      await bgMusic.play();
      musicStarted = true;
      startMusicBtn.textContent = "Закрыть";
      closeVolumeModal();
    } catch {
      volumeValue.textContent = "Нажмите «Включить музыку»";
    }
  });

  skipMusicBtn.addEventListener("click", closeVolumeModal);

  musicToggleBtn.addEventListener("click", () => {
    if (musicStarted) {
      startMusicBtn.textContent = "Закрыть";
    } else {
      startMusicBtn.textContent = "Включить музыку";
    }
    openVolumeModal();
  });

  volumeModal.addEventListener("click", (event) => {
    if (event.target === volumeModal) {
      closeVolumeModal();
    }
  });
}

function openVolumeModal() {
  volumeModal.classList.remove("is-hidden");
}

function closeVolumeModal() {
  volumeModal.classList.add("is-hidden");
}

function initScrollAnimations() {
  const elements = document.querySelectorAll(".fade-in");

  if (!("IntersectionObserver" in window)) {
    elements.forEach((element) => element.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      root: null,
      rootMargin: "0px 0px -12% 0px",
      threshold: 0.12,
    }
  );

  elements.forEach((element, index) => {
    element.style.transitionDelay = `${Math.min(index * 70, 350)}ms`;
    observer.observe(element);
  });
}

function formatTime(value) {
  return String(value).padStart(2, "0");
}

function updateCountdown() {
  const now = Date.now();
  const distance = weddingDate - now;

  if (distance <= 0) {
    daysEl.textContent = "00";
    hoursEl.textContent = "00";
    minutesEl.textContent = "00";
    secondsEl.textContent = "00";
    return;
  }

  const days = Math.floor(distance / (1000 * 60 * 60 * 24));
  const hours = Math.floor((distance / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((distance / (1000 * 60)) % 60);
  const seconds = Math.floor((distance / 1000) % 60);

  daysEl.textContent = formatTime(days);
  hoursEl.textContent = formatTime(hours);
  minutesEl.textContent = formatTime(minutes);
  secondsEl.textContent = formatTime(seconds);
}

updateCountdown();
setInterval(updateCountdown, 1000);
initScrollAnimations();
initBackgroundMusic();

function isSheetApiEnabled() {
  return sheetApiUrl.trim() !== "";
}

function isGuestAttending() {
  return attendanceSelect.value !== "Нет";
}

function updateAttendanceFields() {
  const shouldShowDetails = isGuestAttending();

  attendanceDetailFields.forEach((field) => {
    field.classList.toggle("is-hidden", !shouldShowDetails);
    field.querySelectorAll("select, input").forEach((control) => {
      control.disabled = !shouldShowDetails;
      if (!shouldShowDetails) {
        control.required = false;
        control.value = "";
      }
    });
  });

  if (shouldShowDetails) {
    rsvpForm.querySelector('[name="companions"]').required = true;
    rsvpForm.querySelector('[name="guestCount"]').required = true;
    rsvpForm.querySelector('[name="kids"]').required = true;
    drinksSelect.required = true;
    customDrinkInput.required = drinksSelect.value === "Свой вариант";
    customDrinkWrap.classList.toggle("is-hidden", drinksSelect.value !== "Свой вариант");
  } else {
    customDrinkWrap.classList.add("is-hidden");
    customDrinkInput.required = false;
  }
}

function callSheetApi(action, data = {}) {
  if (!isSheetApiEnabled()) {
    return Promise.reject(new Error("Google Sheet API URL is not configured."));
  }

  const callbackName = `weddingSheetCallback_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2)}`;
  const params = new URLSearchParams({
    action,
    callback: callbackName,
    token: sheetApiToken,
  });

  Object.entries(data).forEach(([key, value]) => {
    params.set(key, value == null ? "" : String(value));
  });

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    const cleanup = () => {
      script.remove();
      delete window[callbackName];
      clearTimeout(timeoutId);
    };
    const timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error("Google Sheet API request timed out."));
    }, 15000);

    window[callbackName] = (response) => {
      cleanup();
      if (!response || response.ok === false) {
        reject(new Error(response?.error || "Google Sheet API error."));
        return;
      }
      resolve(response);
    };

    script.onerror = () => {
      cleanup();
      reject(new Error("Google Sheet API request failed."));
    };

    const separator = sheetApiUrl.includes("?") ? "&" : "?";
    script.src = `${sheetApiUrl}${separator}${params.toString()}`;
    document.body.appendChild(script);
  });
}

function getLocalResponses() {
  const raw = localStorage.getItem(storageKey);
  return raw ? JSON.parse(raw) : [];
}

function saveLocalResponses(data) {
  localStorage.setItem(storageKey, JSON.stringify(data));
}

function saveLocalResponse(payload) {
  const responses = getLocalResponses();
  const filtered = responses.filter((item) => item.guestName !== payload.guestName);
  filtered.push(payload);
  saveLocalResponses(filtered);
}

async function loadResponses() {
  if (!isSheetApiEnabled()) {
    return getLocalResponses();
  }

  const response = await callSheetApi("list");
  return Array.isArray(response.responses) ? response.responses : [];
}

async function saveResponse(payload) {
  if (!isSheetApiEnabled()) {
    saveLocalResponse(payload);
    return;
  }

  await callSheetApi("save", payload);
}

async function deleteResponse(guestName) {
  if (!isSheetApiEnabled()) {
    const updated = getLocalResponses().filter((item) => item.guestName !== guestName);
    saveLocalResponses(updated);
    return;
  }

  await callSheetApi("delete", { guestName });
}

function closeDeleteModal() {
  pendingDeleteGuest = "";
  deleteModal.classList.add("is-hidden");
}

function openDeleteModal(guestName) {
  pendingDeleteGuest = guestName;
  deleteText.textContent = `Удалить ответ гостя "${guestName}"? Это действие нельзя отменить.`;
  deleteModal.classList.remove("is-hidden");
}

function countBy(items, key) {
  return items.reduce((acc, item) => {
    const value = item[key] || "Не указано";
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

function toRingGradient(statMap) {
  const entries = Object.entries(statMap);
  const total = entries.reduce((sum, [, value]) => sum + value, 0) || 1;
  let cursor = 0;
  const segments = entries.map(([, value], index) => {
    const part = (value / total) * 100;
    const start = cursor;
    const end = cursor + part;
    cursor = end;
    const color = chartColors[index % chartColors.length];
    return `${color} ${start}% ${end}%`;
  });
  return segments.length ? `conic-gradient(${segments.join(", ")})` : "conic-gradient(#e8ddd3 0% 100%)";
}

function buildRing(title, statMap) {
  const card = document.createElement("article");
  card.className = "ring-card";

  const heading = document.createElement("h3");
  heading.textContent = title;
  card.appendChild(heading);

  const ring = document.createElement("div");
  ring.className = "ring";
  ring.style.setProperty("--ring-gradient", toRingGradient(statMap));
  card.appendChild(ring);

  const legend = document.createElement("div");
  legend.className = "ring-legend";
  Object.entries(statMap).forEach(([label, count]) => {
    const item = document.createElement("div");
    item.className = "ring-item";
    item.innerHTML = `<span>${label}</span><strong>${count}</strong>`;
    legend.appendChild(item);
  });
  card.appendChild(legend);
  return card;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderAdminDashboard(responses) {
  totalResponsesEl.textContent = String(responses.length);
  totalGuestsEl.textContent = String(
    responses.reduce((sum, response) => {
      const value = response.guestCount === "6+" ? 6 : Number(response.guestCount || 0);
      return sum + (Number.isFinite(value) ? value : 0);
    }, 0)
  );

  responsesBody.innerHTML = "";
  responses.forEach((response) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td data-label="Гость">${escapeHtml(response.guestName)}</td>
      <td data-label="Придет">${escapeHtml(response.attendance)}</td>
      <td data-label="С кем">${escapeHtml(response.companions)}</td>
      <td data-label="Кол-во">${escapeHtml(response.guestCount)}</td>
      <td data-label="Дети">${escapeHtml(response.kids)}</td>
      <td data-label="Напиток">${escapeHtml(response.drinkFinal)}</td>
      <td class="delete-cell">
        <button class="delete-btn" type="button" data-guest="${escapeHtml(response.guestName)}" aria-label="Удалить гостя">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M3 6h18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            <path d="M8 6V4.9C8 4.4 8.4 4 8.9 4h6.2c.5 0 .9.4.9.9V6" stroke="currentColor" stroke-width="1.8"/>
            <path d="M8 10v7M12 10v7M16 10v7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            <path d="M6.8 6h10.4l-.7 12.2c0 .9-.7 1.6-1.6 1.6H9.1c-.9 0-1.6-.7-1.6-1.6L6.8 6z" stroke="currentColor" stroke-width="1.8"/>
          </svg>
        </button>
      </td>
    `;
    responsesBody.appendChild(row);
  });

  statsRings.innerHTML = "";
  const ringConfigs = [
    ["Придут ли гости", countBy(responses, "attendance")],
    ["С кем придут", countBy(responses, "companions")],
    ["Гости с детьми", countBy(responses, "kids")],
    ["Напитки", countBy(responses, "drinkFinal")],
    ["Количество гостей", countBy(responses, "guestCount")],
  ];

  ringConfigs.forEach(([title, map]) => {
    statsRings.appendChild(buildRing(title, map));
  });
}

async function refreshAdminDashboard() {
  adminMessage.textContent = "Загружаем ответы...";

  try {
    const responses = await loadResponses();
    renderAdminDashboard(responses);
    adminMessage.textContent = isSheetApiEnabled()
      ? ""
      : "Google таблица не подключена: ответы хранятся только в этом браузере.";
  } catch (error) {
    console.error(error);
    adminMessage.textContent = "Не удалось загрузить ответы. Проверьте ссылку Apps Script.";
  }
}

guestAuthForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(guestAuthForm);
  const guestName = String(formData.get("guestName") || "").trim();

  if (!guestName) {
    authMessage.textContent = "Пожалуйста, укажите имя и фамилию.";
    return;
  }

  guestNameHidden.value = guestName;
  authMessage.textContent = `Добро пожаловать, ${guestName}! Теперь заполните анкету ниже.`;
  rsvpForm.classList.remove("is-hidden");
});

drinksSelect.addEventListener("change", () => {
  updateAttendanceFields();
});

attendanceSelect.addEventListener("change", () => {
  updateAttendanceFields();
});

rsvpForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(rsvpForm);
  const customDrink = String(formData.get("customDrink") || "").trim();
  const selectedDrink = String(formData.get("drinks") || "");
  const drinkFinal = selectedDrink === "Свой вариант" && customDrink ? customDrink : selectedDrink;

  const payload = {
    guestName: String(formData.get("guestName") || "Без имени"),
    attendance: String(formData.get("attendance") || ""),
    companions: String(formData.get("companions") || ""),
    guestCount: String(formData.get("guestCount") || ""),
    kids: String(formData.get("kids") || ""),
    drinks: selectedDrink,
    drinkFinal,
    submittedAt: new Date().toISOString(),
  };

  formMessage.textContent = "Сохраняем ответ...";

  try {
    await saveResponse(payload);
    formMessage.textContent = isSheetApiEnabled()
      ? "Спасибо! Ваш ответ сохранен."
      : "Спасибо! Ответ сохранен только на этом устройстве, потому что Google таблица еще не подключена.";
    rsvpForm.reset();
    guestNameHidden.value = payload.guestName;
    updateAttendanceFields();

    if (!adminDashboard.classList.contains("is-hidden")) {
      await refreshAdminDashboard();
    }
  } catch (error) {
    console.error(error);
    formMessage.textContent = "Не удалось сохранить ответ. Проверьте подключение Google таблицы.";
  }
});

adminLoginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(adminLoginForm);
  const password = String(formData.get("adminPassword") || "");
  if (password !== adminPassword) {
    adminMessage.textContent = "Неверный пароль администратора.";
    return;
  }

  adminMessage.textContent = "";
  adminDashboard.classList.remove("is-hidden");
  await refreshAdminDashboard();
});

responsesBody.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof Element)) {
    return;
  }

  const button = target.closest(".delete-btn");
  if (!button) {
    return;
  }

  const guestName = button.getAttribute("data-guest") || "";
  if (!guestName) {
    return;
  }

  openDeleteModal(guestName);
});

cancelDeleteBtn.addEventListener("click", closeDeleteModal);

confirmDeleteBtn.addEventListener("click", async () => {
  if (!pendingDeleteGuest) {
    closeDeleteModal();
    return;
  }

  const guestName = pendingDeleteGuest;
  confirmDeleteBtn.disabled = true;

  try {
    await deleteResponse(guestName);
    closeDeleteModal();
    await refreshAdminDashboard();
  } catch {
    adminMessage.textContent = "Не удалось удалить ответ. Попробуйте еще раз.";
  } finally {
    confirmDeleteBtn.disabled = false;
  }
});

deleteModal.addEventListener("click", (event) => {
  if (event.target === deleteModal) {
    closeDeleteModal();
  }
});
