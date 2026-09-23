/* =========================================================
   ZCORP PANEL
   Website client / dashboard controller
   ========================================================= */

const CONFIG = {
  // Put your deployed Telegram bot/API URL here.
  // Example:
  // API_BASE: "https://zcorp-panel-api.onrender.com"
  API_BASE: "",

  // Official ZCORP Store bot for getting login details
  STORE_BOT_LINK: "https://t.me/ZCORPSTORE_BOT"
};

const $ = (id) => document.getElementById(id);

const state = {
  token: localStorage.getItem("zcorp_panel_token") || "",
  user: null,
  dashboard: null,
  serverState: "online"
};

/* =========================================================
   API
   ========================================================= */

function apiUrl(path) {
  return `${CONFIG.API_BASE.replace(/\/$/, "")}${path}`;
}

async function api(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  if (state.token) {
    headers.Authorization = `Bearer ${state.token}`;
  }

  const response = await fetch(apiUrl(path), {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.error || `Request failed (${response.status})`
    );
  }

  return data;
}

/* =========================================================
   LOGIN / LOGOUT
   ========================================================= */

function showLoginError(message) {
  const error = $("loginError");

  if (!error) return;

  error.textContent = message;
  error.classList.remove("hidden");
}

function clearLoginError() {
  const error = $("loginError");

  if (!error) return;

  error.classList.add("hidden");
}

function showPanel() {
  $("loginView")?.classList.add("hidden");
  $("panelView")?.classList.remove("hidden");
}

function showLogin() {
  $("panelView")?.classList.add("hidden");
  $("loginView")?.classList.remove("hidden");
}

async function login(username, password) {
  const data = await api("/api/login", {
    method: "POST",
    body: JSON.stringify({
      username,
      password
    })
  });

  state.token = data.token;
  state.user = data.user;

  localStorage.setItem(
    "zcorp_panel_token",
    state.token
  );

  showPanel();

  await loadDashboard();
}

const loginForm = $("loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    clearLoginError();

    const username = $("username")?.value.trim();
    const password = $("password")?.value || "";

    if (!username || !password) {
      showLoginError("Enter your username and password.");
      return;
    }

    try {
      await login(username, password);
    } catch (error) {
      showLoginError(error.message);
    }
  });
}

/* =========================================================
   LOGOUT
   ========================================================= */

const logoutBtn = $("logoutBtn");

if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    try {
      if (state.token) {
        await api("/api/logout", {
          method: "POST"
        });
      }
    } catch {}

    state.token = "";
    state.user = null;
    state.dashboard = null;

    localStorage.removeItem(
      "zcorp_panel_token"
    );

    showLogin();
  });
}

/* =========================================================
   USER INFORMATION
   ========================================================= */

function renderUser() {
  if (!state.user) return;

  const user = state.user;

  const planLine = $("planLine");
  const footerPlan = $("footerPlan");
  const disk = $("disk");

  if (planLine) {
    planLine.textContent =
      `${user.planName} • ${user.active ? "Active" : "Expired"}`;
  }

  if (footerPlan) {
    footerPlan.textContent =
      `${user.planName} • Expires ${new Date(
        user.expiresAt
      ).toLocaleString()}`;
  }

  if (disk) {
    disk.textContent =
      user.diskMb === null
        ? "Unlimited"
        : `${user.diskMb} MB`;
  }
}

/* =========================================================
   DASHBOARD
   ========================================================= */

async function loadDashboard() {
  const data = await api("/api/dashboard");

  state.dashboard = data;
  state.user = data.user;

  renderDashboard(data);
  tabContent("Console");
}

function renderDashboard(data) {
  if (!data || !data.server) return;

  const server = data.server;

  if ($("serverName")) {
    $("serverName").textContent =
      server.name || "ZCORP PANEL";
  }

  if ($("address")) {
    $("address").textContent =
      server.address || "zcorp-panel";
  }

  if ($("uptime")) {
    $("uptime").textContent =
      state.serverState === "stopped"
        ? "Stopped"
        : server.uptime || "Online";
  }

  if ($("cpu")) {
    $("cpu").textContent =
      `${Number(server.cpu || 0).toFixed(2)}%`;
  }

  if ($("memory")) {
    $("memory").textContent =
      `${server.memoryMb ?? 0} MB`;
  }

  if ($("disk")) {
    $("disk").textContent =
      data.user?.diskMb === null
        ? "Unlimited"
        : `${data.user?.diskMb ?? 0} MB`;
  }

  if ($("netIn")) {
    $("netIn").textContent =
      `${server.networkIn ?? 0} B`;
  }

  if ($("netOut")) {
    $("netOut").textContent =
      `${server.networkOut ?? 0} B`;
  }

  renderUser();
}

/* =========================================================
   PANEL TABS
   ========================================================= */

function tabContent(tab) {
  const map = {
    Console: [
      "Console",
      "Your ZCORP server console.",
      "Use the command box below for portal commands."
    ],

    Files: [
      "Files",
      "File manager",
      "File management will be available when the hosting backend is connected."
    ],

    Databases: [
      "Databases",
      "Database management",
      "Database controls will appear when a hosting backend is connected."
    ],

    Schedules: [
      "Schedules",
      "Scheduled tasks",
      "No schedules are currently configured."
    ],

    Users: [
      "Users",
      "Panel users",
      `Telegram account: ${state.user?.telegramId || "—"}`
    ],

    Backups: [
      "Backups",
      "Server backups",
      "No backup records are currently available."
    ],

    Network: [
      "Network",
      "Network information",
      "Inbound and outbound traffic counters are shown on the dashboard."
    ],

    Startup: [
      "Startup",
      "Startup configuration",
      "Startup configuration is currently read-only."
    ],

    Settings: [
      "Settings",
      "Account settings",
      `
        Plan: ${state.user?.planName || "—"}<br>
        Expires: ${
          state.user
            ? new Date(state.user.expiresAt).toLocaleString()
            : "—"
        }
      `
    ]
  };

  const item = map[tab] || map.Console;

  if ($("tabTitle")) {
    $("tabTitle").textContent = item[0];
  }

  if ($("tabDescription")) {
    $("tabDescription").textContent = item[1];
  }

  if ($("tabBody")) {
    $("tabBody").innerHTML = item[2];
  }
}

/* =========================================================
   TAB BUTTONS
   ========================================================= */

document.querySelectorAll(".tab").forEach((button) => {
  button.addEventListener("click", () => {
    document
      .querySelectorAll(".tab")
      .forEach((btn) => btn.classList.remove("active"));

    button.classList.add("active");

    tabContent(button.dataset.tab);
  });
});

/* =========================================================
   CONSOLE
   ========================================================= */

function escapeHTML(value) {
  return String(value).replace(/[<>&"']/g, (char) => {
    const entities = {
      "<": "&lt;",
      ">": "&gt;",
      "&": "&amp;",
      '"': "&quot;",
      "'": "&#039;"
    };

    return entities[char];
  });
}

function addConsole(line) {
  const output = $("consoleOutput");

  if (!output) return;

  const div = document.createElement("div");

  div.innerHTML = line;

  output.appendChild(div);

  output.scrollTop =
    output.scrollHeight;
}

const commandForm = $("commandForm");

if (commandForm) {
  commandForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const input = $("commandInput");

    if (!input) return;

    const value = input.value.trim();

    if (!value) return;

    const safeCommand =
      escapeHTML(value);

    addConsole(
      `<span class="gold">[command]</span> ${safeCommand}`
    );

    addConsole(
      `<span class="green">[ZCORP]</span> Portal received command: ${safeCommand}`
    );

    input.value = "";
  });
}

/* =========================================================
   SERVER CONTROLS
   ========================================================= */

function setServerState(next) {
  state.serverState = next;

  if ($("uptime")) {
    $("uptime").textContent =
      next === "stopped"
        ? "Stopped"
        : next === "restarting"
          ? "Restarting"
          : state.dashboard?.server?.uptime || "Online";
  }

  addConsole(
    `<span class="gold">[ZCORP PANEL]</span> Server UI state changed to <b>${escapeHTML(next)}</b>.`
  );
}

const startBtn = $("startBtn");

if (startBtn) {
  startBtn.addEventListener("click", () => {
    setServerState("online");
  });
}

const restartBtn = $("restartBtn");

if (restartBtn) {
  restartBtn.addEventListener("click", () => {
    setServerState("restarting");

    setTimeout(() => {
      setServerState("online");
    }, 700);
  });
}

const stopBtn = $("stopBtn");

if (stopBtn) {
  stopBtn.addEventListener("click", () => {
    setServerState("stopped");
  });
}

/* =========================================================
   ZCORP STORE BOT
   GET LOGIN BUTTONS / STORE LINKS
   ========================================================= */

function setupStoreLinks() {
  document
    .querySelectorAll(".store-link")
    .forEach((link) => {
      link.href = CONFIG.STORE_BOT_LINK;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    });
}

setupStoreLinks();

/* =========================================================
   OPTIONAL GET LOGIN BUTTON
   ========================================================= */

const getLoginBtn = $("getLogin");

if (getLoginBtn) {
  getLoginBtn.addEventListener("click", () => {
    window.open(
      CONFIG.STORE_BOT_LINK,
      "_blank",
      "noopener,noreferrer"
    );
  });
}

/* Support common IDs/classes used for GET LOGIN */
document
  .querySelectorAll(
    "#getLoginBtn, #getLogin, .get-login, .getLogin"
  )
  .forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();

      window.open(
        CONFIG.STORE_BOT_LINK,
        "_blank",
        "noopener,noreferrer"
      );
    });
  });

/* =========================================================
   AUTO LOGIN
   ========================================================= */

(async function boot() {
  setupStoreLinks();

  if (!state.token) {
    showLogin();
    return;
  }

  try {
    const me = await api("/api/me");

    state.user = me.user;

    showPanel();

    await loadDashboard();
  } catch (error) {
    console.warn(
      "ZCORP PANEL session expired:",
      error
    );

    state.token = "";
    state.user = null;

    localStorage.removeItem(
      "zcorp_panel_token"
    );

    showLogin();
  }
})();
