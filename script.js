(() => {
  const STORAGE_KEY = "planowanie-slubu-plan-v1";
  const taskGroups = [
    {
      name: "Najpierw wspólny obraz",
      tasks: [
        ["format", "Uzgodnić, jaki dzień chcecie zorganizować"],
        ["priorities", "Zapisać wspólne priorytety"],
        ["limit", "Ustalić górny limit budżetu"],
        ["guest-range", "Oszacować liczbę gości w przedziale"]
      ]
    },
    {
      name: "Termin i miejsce",
      tasks: [
        ["dates", "Sprawdzić kilka możliwych terminów"],
        ["place", "Porównać miejsca dla wybranej skali wydarzenia"],
        ["logistics", "Sprawdzić dojazd, dostępność i noclegi"]
      ]
    },
    {
      name: "Usługi i goście",
      tasks: [
        ["offers", "Wysłać podobne zapytania do wybranych usług"],
        ["compare", "Porównać dostępność, zakres i koszt"],
        ["invite", "Ustalić sposób potwierdzania obecności"]
      ]
    },
    {
      name: "Przebieg dnia",
      tasks: [
        ["schedule", "Ułożyć szkic przebiegu dnia z buforami"],
        ["roles", "Przydzielić role osobom, które chcą pomóc"],
        ["backup", "Zapisać prosty wariant zapasowy"]
      ]
    }
  ];

  const rowDefinitions = {
    service: {
      selector: "[data-service-rows]",
      fields: [
        ["service", "Usługa", "np. miejsce"],
        ["provider", "Miejsce lub osoba", "nazwa / opis"],
        ["availability", "Dostępność", "termin / informacja"],
        ["scope", "Zakres", "co obejmuje"],
        ["cost", "Koszt", "zł", "number"],
        ["next", "Następny krok", "co sprawdzić"]
      ],
      removeLabel: "Usuń wiersz usługi"
    },
    schedule: {
      selector: "[data-schedule-rows]",
      fields: [
        ["time", "Godzina", "np. 12:30"],
        ["item", "Punkt lub miejsce", "np. ceremonia"],
        ["owner", "Osoba prowadząca", "kto"],
        ["note", "Notatka", "przejazd, sprzęt, bufor"]
      ],
      removeLabel: "Usuń punkt dnia"
    },
    backup: {
      selector: "[data-backup-rows]",
      fields: [
        ["situation", "Sytuacja", "np. zmiana pogody"],
        ["plan", "Wariant lub następny ruch", "co wtedy zrobicie"],
        ["owner", "Osoba kontaktowa", "kto zna plan"]
      ],
      removeLabel: "Usuń sytuację"
    }
  };

  function createDefaultState() {
    const tasks = [];
    taskGroups.forEach((group) => {
      group.tasks.forEach(([id, label]) => tasks.push({ id, label, group: group.name, done: false, custom: false }));
    });
    return {
      brief: {},
      tasks,
      budget: {},
      services: [],
      guests: { invited: "", confirmed: "" },
      schedule: [],
      backup: [
        { situation: "Zmiana pogody", plan: "", owner: "" },
        { situation: "Opóźnienie w dojeździe", plan: "", owner: "" }
      ]
    };
  }

  function loadState() {
    const initial = createDefaultState();
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (!stored || typeof stored !== "object") return initial;
      return {
        brief: { ...initial.brief, ...(stored.brief || {}) },
        tasks: Array.isArray(stored.tasks) ? stored.tasks : initial.tasks,
        budget: { ...initial.budget, ...(stored.budget || {}) },
        services: Array.isArray(stored.services) ? stored.services : initial.services,
        guests: { ...initial.guests, ...(stored.guests || {}) },
        schedule: Array.isArray(stored.schedule) ? stored.schedule : initial.schedule,
        backup: Array.isArray(stored.backup) ? stored.backup : initial.backup
      };
    } catch {
      return initial;
    }
  }

  let state = loadState();
  let toastTimer;

  function makeId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") return window.crypto.randomUUID();
    return `row-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function showToast(message) {
    const toast = document.querySelector("[data-toast]");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2400);
  }

  function formatMoney(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return "—";
    return new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 0 }).format(number) + " zł";
  }

  function numericValue(value) {
    if (value === "" || value === null || typeof value === "undefined") return null;
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 ? number : 0;
  }

  function makeTaskElement(task) {
    const item = document.createElement("li");
    item.className = "task-item" + (task.done ? " is-done" : "");
    item.dataset.taskId = task.id;
    item.dataset.taskGroup = task.group;
    item.dataset.taskCustom = String(Boolean(task.custom));

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = Boolean(task.done);
    checkbox.dataset.taskComplete = "true";
    checkbox.setAttribute("aria-label", `Oznacz jako zrobione: ${task.label}`);

    const label = document.createElement("span");
    label.className = "task-label";
    label.textContent = task.label;

    item.append(checkbox, label);
    if (task.custom) {
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "task-delete";
      remove.dataset.removeTask = "true";
      remove.setAttribute("aria-label", `Usuń zadanie: ${task.label}`);
      remove.textContent = "×";
      item.append(remove);
    }
    return item;
  }

  function renderTasks(tasks) {
    const container = document.querySelector("[data-task-groups]");
    if (!container) return;
    container.replaceChildren();
    const groups = new Map();
    tasks.forEach((task) => {
      const groupName = task.group || "Dodatkowe";
      if (!groups.has(groupName)) groups.set(groupName, []);
      groups.get(groupName).push(task);
    });
    groups.forEach((groupTasks, name) => {
      const group = document.createElement("section");
      group.className = "task-group";
      const heading = document.createElement("h3");
      heading.textContent = name;
      const list = document.createElement("ul");
      list.className = "task-list";
      groupTasks.forEach((task) => list.append(makeTaskElement(task)));
      group.append(heading, list);
      container.append(group);
    });
  }

  function makeInput(field, value, rowNumber, rowName) {
    const [key, label, placeholder, type] = field;
    const input = document.createElement("input");
    input.type = type === "number" ? "number" : "text";
    if (input.type === "number") {
      input.min = "0";
      input.step = "50";
      input.inputMode = "decimal";
    }
    input.value = value === null || typeof value === "undefined" ? "" : String(value);
    input.placeholder = placeholder;
    input.dataset.rowField = key;
    input.setAttribute("aria-label", `${label}, ${rowName} ${rowNumber}`);
    return input;
  }

  function renderRows(kind, rows) {
    const definition = rowDefinitions[kind];
    const body = document.querySelector(definition.selector);
    if (!body) return;
    body.replaceChildren();
    rows.forEach((row, index) => {
      const tr = document.createElement("tr");
      tr.dataset.rowId = row.id || makeId();
      tr.dataset.rowKind = kind;
      definition.fields.forEach((field) => {
        const td = document.createElement("td");
        td.append(makeInput(field, row[field[0]], index + 1, definition.removeLabel.replace("Usuń ", "")));
        tr.append(td);
      });
      const removeCell = document.createElement("td");
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "row-remove";
      remove.dataset.removeRow = "true";
      remove.setAttribute("aria-label", definition.removeLabel);
      remove.textContent = "×";
      removeCell.append(remove);
      tr.append(removeCell);
      body.append(tr);
    });
  }

  function collectRows(kind) {
    const definition = rowDefinitions[kind];
    const body = document.querySelector(definition.selector);
    return Array.from(body ? body.querySelectorAll("tr[data-row-kind]") : []).map((row) => {
      const data = { id: row.dataset.rowId };
      row.querySelectorAll("[data-row-field]").forEach((input) => {
        data[input.dataset.rowField] = input.value.trim();
      });
      return data;
    });
  }

  function readCurrentState() {
    const brief = {};
    document.querySelectorAll("[data-brief]").forEach((input) => { brief[input.dataset.brief] = input.value.trim(); });
    const budget = {};
    document.querySelectorAll("[data-budget-category]").forEach((input) => { budget[input.dataset.budgetCategory] = input.value; });
    const tasks = Array.from(document.querySelectorAll(".task-item")).map((item) => ({
      id: item.dataset.taskId,
      label: item.querySelector(".task-label").textContent,
      group: item.dataset.taskGroup,
      done: item.querySelector("[data-task-complete]").checked,
      custom: item.dataset.taskCustom === "true"
    }));
    return {
      brief,
      tasks,
      budget,
      services: collectRows("service"),
      guests: {
        invited: document.querySelector('[data-guest-count="invited"]').value,
        confirmed: document.querySelector('[data-guest-count="confirmed"]').value
      },
      schedule: collectRows("schedule"),
      backup: collectRows("backup")
    };
  }

  function saveState(showMessage) {
    state = readCurrentState();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      const hint = document.querySelector(".save-hint");
      if (hint) hint.textContent = "Pamięć tej przeglądarki jest niedostępna — wpisy nie zostaną zachowane po zamknięciu strony.";
      if (showMessage) showToast("Nie udało się zapisać planu w tej przeglądarce.");
      return;
    }
    updateSummary();
    if (showMessage) showToast("Plan zapisany w tej przeglądarce.");
  }

  function updateSummary() {
    const total = state.tasks.length;
    const completed = state.tasks.filter((task) => task.done).length;
    const percent = total ? Math.round((completed / total) * 100) : 0;
    const progressPercent = document.querySelector("[data-progress-percent]");
    const progressCount = document.querySelector("[data-progress-count]");
    const progressBar = document.querySelector("[data-progress-bar]");
    if (progressPercent) progressPercent.textContent = `${percent}%`;
    if (progressCount) progressCount.textContent = `${completed} z ${total} zadań`;
    if (progressBar) progressBar.value = percent;

    const next = state.tasks.find((task) => !task.done);
    const nextTask = document.querySelector("[data-next-task]");
    const nextHint = document.querySelector("[data-next-task-hint]");
    if (nextTask) nextTask.textContent = next ? next.label : "Wszystkie zapisane zadania są gotowe";
    if (nextHint) nextHint.textContent = next ? `Kategoria: ${next.group}. Możecie zmienić kolejność według własnych potrzeb.` : "Dodajcie własny krok, jeśli pojawi się coś nowego.";

    const limitInput = document.querySelector('[data-brief="budgetLimit"]');
    const limit = numericValue(limitInput ? limitInput.value : "");
    const spent = Array.from(document.querySelectorAll("[data-budget-category]")).reduce((sum, input) => sum + (numericValue(input.value) || 0), 0);
    const limitOutput = document.querySelector("[data-budget-limit]");
    const spentOutput = document.querySelector("[data-budget-spent]");
    const remainingOutput = document.querySelector("[data-budget-remaining]");
    const budgetStatus = document.querySelector("[data-budget-status]");
    const budgetDot = document.querySelector("[data-budget-dot]");
    if (limitOutput) limitOutput.textContent = limit === null ? "—" : formatMoney(limit);
    if (spentOutput) spentOutput.textContent = formatMoney(spent);
    if (remainingOutput) remainingOutput.textContent = limit === null ? "—" : formatMoney(limit - spent);
    if (budgetDot) budgetDot.className = "budget-status-dot";
    if (budgetStatus) {
      if (limit === null) {
        budgetStatus.textContent = "Dodajcie limit, żeby zobaczyć podsumowanie.";
      } else if (spent > limit) {
        budgetStatus.textContent = `Wpisane kwoty przekraczają limit o ${formatMoney(spent - limit)}.`;
        if (budgetDot) budgetDot.classList.add("is-over");
      } else {
        budgetStatus.textContent = `Po wpisanych kwotach pozostaje ${formatMoney(limit - spent)}.`;
        if (budgetDot) budgetDot.classList.add("is-under");
      }
    }

    const minGuests = numericValue(document.querySelector('[data-brief="guestMin"]')?.value);
    const maxGuests = numericValue(document.querySelector('[data-brief="guestMax"]')?.value);
    const guestRange = document.querySelector("[data-guest-range]");
    if (guestRange) guestRange.textContent = minGuests === null && maxGuests === null ? "—" : `${minGuests === null ? "?" : minGuests}–${maxGuests === null ? "?" : maxGuests}`;
    const invited = numericValue(document.querySelector('[data-guest-count="invited"]').value) || 0;
    const confirmed = numericValue(document.querySelector('[data-guest-count="confirmed"]').value) || 0;
    const pending = document.querySelector("[data-guest-pending]");
    if (pending) pending.textContent = String(Math.max(invited - confirmed, 0));
  }

  function applyState(nextState) {
    document.querySelectorAll("[data-brief]").forEach((input) => {
      input.value = nextState.brief[input.dataset.brief] || "";
    });
    document.querySelectorAll("[data-budget-category]").forEach((input) => {
      input.value = nextState.budget[input.dataset.budgetCategory] || "";
    });
    document.querySelector('[data-guest-count="invited"]').value = nextState.guests.invited || "";
    document.querySelector('[data-guest-count="confirmed"]').value = nextState.guests.confirmed || "";
    renderTasks(nextState.tasks);
    renderRows("service", nextState.services);
    renderRows("schedule", nextState.schedule);
    renderRows("backup", nextState.backup);
    state = nextState;
    updateSummary();
  }

  function addRow(kind, values) {
    const rows = collectRows(kind);
    rows.push({ id: makeId(), ...(values || {}) });
    renderRows(kind, rows);
    saveState(false);
  }

  applyState(state);

  document.addEventListener("input", (event) => {
    if (event.target.matches("[data-brief], [data-budget-category], [data-guest-count], [data-row-field]")) saveState(false);
  });
  document.addEventListener("change", (event) => {
    if (event.target.matches("[data-task-complete]")) {
      event.target.closest(".task-item").classList.toggle("is-done", event.target.checked);
      saveState(false);
    }
  });
  document.addEventListener("click", (event) => {
    const removeRow = event.target.closest("[data-remove-row]");
    if (removeRow) {
      removeRow.closest("tr").remove();
      saveState(false);
      return;
    }
    const removeTask = event.target.closest("[data-remove-task]");
    if (removeTask) {
      removeTask.closest(".task-item").remove();
      saveState(false);
      return;
    }
    if (event.target.closest("[data-print]")) window.print();
  });

  document.querySelector("[data-add-task-form]").addEventListener("submit", (event) => {
    event.preventDefault();
    const input = event.currentTarget.elements.task;
    const label = input.value.trim();
    if (!label) {
      input.focus();
      return;
    }
    const tasks = collectCurrentTasks();
    tasks.push({ id: makeId(), label, group: "Dodatkowe", done: false, custom: true });
    renderTasks(tasks);
    input.value = "";
    saveState(false);
    showToast("Dodano zadanie do planu.");
  });

  function collectCurrentTasks() {
    return Array.from(document.querySelectorAll(".task-item")).map((item) => ({
      id: item.dataset.taskId,
      label: item.querySelector(".task-label").textContent,
      group: item.dataset.taskGroup,
      done: item.querySelector("[data-task-complete]").checked,
      custom: item.dataset.taskCustom === "true"
    }));
  }

  document.querySelector("[data-add-service]").addEventListener("click", () => addRow("service"));
  document.querySelector("[data-add-schedule]").addEventListener("click", () => addRow("schedule"));
  document.querySelector("[data-add-backup]").addEventListener("click", () => addRow("backup"));

  document.querySelector("[data-clear]").addEventListener("click", () => {
    if (!window.confirm("Wyczyścić wszystkie wpisy zapisane w tej przeglądarce?")) return;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      showToast("Nie udało się wyczyścić pamięci przeglądarki.");
      return;
    }
    state = createDefaultState();
    applyState(state);
    showToast("Wyczyszczono zapisany plan.");
  });

  const menuButton = document.querySelector(".nav-toggle");
  const menu = document.querySelector("#site-nav");
  function closeMenu() {
    if (!menuButton || !menu) return;
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "Otwórz menu");
    menu.classList.remove("is-open");
  }
  if (menuButton && menu) {
    menuButton.addEventListener("click", () => {
      const isOpen = menuButton.getAttribute("aria-expanded") === "true";
      menuButton.setAttribute("aria-expanded", String(!isOpen));
      menuButton.setAttribute("aria-label", isOpen ? "Otwórz menu" : "Zamknij menu");
      menu.classList.toggle("is-open", !isOpen);
    });
    menu.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
    document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeMenu(); });
  }
})();
