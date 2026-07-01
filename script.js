const weddingDate = new Date("2026-08-02T17:00:00+03:00").getTime();
const storageKey = "wedding-rsvp-responses-v1";
const adminPassword = "admin2026";
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
let pendingDeleteGuest = "";

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

function getResponses() {
  const raw = localStorage.getItem(storageKey);
  return raw ? JSON.parse(raw) : [];
}

function saveResponses(data) {
  localStorage.setItem(storageKey, JSON.stringify(data));
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

function renderAdminDashboard() {
  const responses = getResponses();
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
      <td data-label="Гость">${response.guestName}</td>
      <td data-label="Придет">${response.attendance}</td>
      <td data-label="С кем">${response.companions}</td>
      <td data-label="Кол-во">${response.guestCount}</td>
      <td data-label="Дети">${response.kids}</td>
      <td data-label="Напиток">${response.drinkFinal}</td>
      <td class="delete-cell">
        <button class="delete-btn" type="button" data-guest="${response.guestName}" aria-label="Удалить гостя">
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
  const isCustom = drinksSelect.value === "Свой вариант";
  customDrinkWrap.classList.toggle("is-hidden", !isCustom);
  customDrinkInput.required = isCustom;
});

rsvpForm.addEventListener("submit", (event) => {
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

  const responses = getResponses();
  const filtered = responses.filter((item) => item.guestName !== payload.guestName);
  filtered.push(payload);
  saveResponses(filtered);

  formMessage.textContent = "Спасибо! Ваш ответ сохранен.";
  rsvpForm.reset();
  customDrinkWrap.classList.add("is-hidden");
  customDrinkInput.required = false;
});

adminLoginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(adminLoginForm);
  const password = String(formData.get("adminPassword") || "");
  if (password !== adminPassword) {
    adminMessage.textContent = "Неверный пароль администратора.";
    return;
  }

  adminMessage.textContent = "";
  adminDashboard.classList.remove("is-hidden");
  renderAdminDashboard();
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

confirmDeleteBtn.addEventListener("click", () => {
  if (!pendingDeleteGuest) {
    closeDeleteModal();
    return;
  }

  const updated = getResponses().filter((item) => item.guestName !== pendingDeleteGuest);
  saveResponses(updated);
  renderAdminDashboard();
  closeDeleteModal();
});

deleteModal.addEventListener("click", (event) => {
  if (event.target === deleteModal) {
    closeDeleteModal();
  }
});
