const els = {
  baseUrl: document.getElementById("baseUrl"),
  pingBtn: document.getElementById("pingBtn"),
  themeBtn: document.getElementById("themeBtn"),
  statusDot: document.getElementById("statusDot"),
  statusTitle: document.getElementById("statusTitle"),
  statusSub: document.getElementById("statusSub"),

  tabs: Array.from(document.querySelectorAll(".tab")),
  panes: Array.from(document.querySelectorAll(".pane")),
  loginForm: document.getElementById("loginForm"),
  signupForm: document.getElementById("signupForm"),
  switchToLoginBtn: document.getElementById("switchToLoginBtn"),

  loginEmail: document.getElementById("loginEmail"),
  loginPassword: document.getElementById("loginPassword"),
  signupName: document.getElementById("signupName"),
  signupEmail: document.getElementById("signupEmail"),
  signupPassword: document.getElementById("signupPassword"),

  logoutBtn: document.getElementById("logoutBtn"),
  copyTokenBtn: document.getElementById("copyTokenBtn"),
  tokenText: document.getElementById("tokenText"),

  authNotice: document.getElementById("authNotice"),
  createGoalForm: document.getElementById("createGoalForm"),
  goalTitle: document.getElementById("goalTitle"),
  createBtn: document.getElementById("createBtn"),
  clearLocalBtn: document.getElementById("clearLocalBtn"),

  goalOpsForm: document.getElementById("goalOpsForm"),
  goalId: document.getElementById("goalId"),
  fetchBtn: document.getElementById("fetchBtn"),
  toggleCompleteBtn: document.getElementById("toggleCompleteBtn"),
  deleteBtn: document.getElementById("deleteBtn"),
  goalPreview: document.getElementById("goalPreview"),

  goalsList: document.getElementById("goalsList"),
  toasts: document.getElementById("toasts"),
};

const storage = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
  del(key) {
    localStorage.removeItem(key);
  },
};

const state = {
  theme: storage.get("ui.theme", "funky"),
  token: storage.get("auth.token", ""),
  baseUrl: storage.get("api.baseUrl", "http://localhost:8000"),
  localGoals: storage.get("goals.local", []),
  selectedGoal: null,
};

function normalizeBaseUrl(input) {
  const s = String(input || "").trim().replace(/\/+$/, "");
  return s || "http://localhost:8000";
}

function setTheme(theme) {
  const t = theme === "professional" ? "professional" : "funky";
  document.documentElement.setAttribute("data-theme", t);
  state.theme = t;
  storage.set("ui.theme", t);
  els.themeBtn.textContent = t === "professional" ? "Professional Mode" : "Funky Mode";
}

function toast(kind, title, sub = "") {
  const t = document.createElement("div");
  t.className = `toast ${kind || ""}`.trim();
  const titleEl = document.createElement("div");
  titleEl.className = "toast-title";
  titleEl.textContent = title;
  const subEl = document.createElement("div");
  subEl.className = "toast-sub";
  subEl.textContent = sub;
  t.appendChild(titleEl);
  if (sub) t.appendChild(subEl);
  els.toasts.appendChild(t);
  setTimeout(() => {
    t.style.opacity = "0";
    t.style.transform = "translateY(6px)";
    t.style.transition = "opacity 140ms ease, transform 140ms ease";
    setTimeout(() => t.remove(), 160);
  }, 3200);
}

function setStatus(kind, title, sub) {
  els.statusDot.classList.remove("is-ok", "is-bad");
  if (kind === "ok") els.statusDot.classList.add("is-ok");
  if (kind === "bad") els.statusDot.classList.add("is-bad");
  els.statusTitle.textContent = title;
  els.statusSub.textContent = sub;
}

function setToken(token) {
  state.token = token || "";
  storage.set("auth.token", state.token);
  els.tokenText.value = state.token;
  const has = Boolean(state.token);
  els.logoutBtn.disabled = !has;
  els.copyTokenBtn.disabled = !has;

  els.createBtn.disabled = !has;
  els.fetchBtn.disabled = !has;
  els.toggleCompleteBtn.disabled = !has;
  els.deleteBtn.disabled = !has;

  els.authNotice.classList.toggle("is-hidden", has);
}

function selectTab(name) {
  els.tabs.forEach((b) => b.classList.toggle("is-active", b.dataset.tab === name));
  els.panes.forEach((p) => p.classList.toggle("is-active", p.dataset.pane === name));
}

function apiUrl(path) {
  const base = normalizeBaseUrl(els.baseUrl.value || state.baseUrl);
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

async function apiFetch(path, { method = "GET", body, auth = false } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    if (!state.token) throw new Error("Login required (missing token).");
    headers.Authorization = `Bearer ${state.token}`;
  }
  const res = await fetch(apiUrl(path), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const contentType = res.headers.get("content-type") || "";
  let payload = null;
  if (contentType.includes("application/json")) {
    payload = await res.json().catch(() => null);
  } else {
    payload = await res.text().catch(() => "");
  }

  if (!res.ok) {
    const msg =
      (payload && typeof payload === "object" && (payload.message || payload.error)) ||
      (typeof payload === "string" ? payload : "") ||
      `Request failed (${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    err.payload = payload;
    throw err;
  }
  return payload;
}

function saveGoals() {
  storage.set("goals.local", state.localGoals);
}

function upsertLocalGoal(goal) {
  if (!goal || !goal._id) return;
  const idx = state.localGoals.findIndex((g) => g._id === goal._id);
  if (idx >= 0) state.localGoals[idx] = { ...state.localGoals[idx], ...goal };
  else state.localGoals.unshift(goal);
  saveGoals();
  renderGoals();
}

function removeLocalGoal(id) {
  state.localGoals = state.localGoals.filter((g) => g._id !== id);
  saveGoals();
  renderGoals();
}

function renderGoalPreview(goal) {
  state.selectedGoal = goal || null;
  if (!goal) {
    els.goalPreview.innerHTML = `<div class="muted">No goal selected.</div>`;
    return;
  }

  const completed = Boolean(goal.completed);
  const title = goal.title || "(no title)";
  const id = goal._id || "";
  els.goalPreview.innerHTML = `
    <div class="goal-card">
      <div class="goal-top">
        <div>
          <div class="goal-title">${escapeHtml(title)}</div>
          <div class="goal-meta">_id: <span class="mono">${escapeHtml(id)}</span></div>
        </div>
        <div class="pillrow">
          <span class="tag ${completed ? "ok" : "warn"}">${completed ? "completed: true" : "completed: false"}</span>
        </div>
      </div>
      <div class="pillrow">
        <span class="tag">GET /${escapeHtml(id)}</span>
        <span class="tag">PUT /${escapeHtml(id)}</span>
        <span class="tag">DELETE /${escapeHtml(id)}</span>
      </div>
    </div>
  `;
}

function renderGoals() {
  if (!Array.isArray(state.localGoals) || state.localGoals.length === 0) {
    els.goalsList.innerHTML = `<div class="muted tiny">No local goals yet. Create one to see it here.</div>`;
    return;
  }

  els.goalsList.innerHTML = state.localGoals
    .map((g) => {
      const completed = Boolean(g.completed);
      const title = g.title || "(no title)";
      const id = g._id || "";
      return `
        <div class="goal-card">
          <div class="goal-top">
            <div>
              <div class="goal-title">${escapeHtml(title)}</div>
              <div class="goal-meta"><span class="mono">${escapeHtml(id)}</span></div>
            </div>
            <span class="tag ${completed ? "ok" : "warn"}">${completed ? "done" : "todo"}</span>
          </div>
          <div class="pillrow">
            <button class="btn btn-ghost btn-sm" type="button" data-act="select" data-id="${escapeAttr(
              id,
            )}">Select</button>
            <button class="btn btn-ghost btn-sm" type="button" data-act="fetch" data-id="${escapeAttr(
              id,
            )}">Fetch</button>
            <button class="btn btn-ghost btn-sm" type="button" data-act="toggle" data-id="${escapeAttr(
              id,
            )}">Toggle</button>
            <button class="btn btn-danger btn-sm" type="button" data-act="delete" data-id="${escapeAttr(
              id,
            )}">Delete</button>
          </div>
        </div>
      `;
    })
    .join("");
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(s) {
  return escapeHtml(s).replaceAll("`", "&#096;");
}

async function pingBackend() {
  const base = normalizeBaseUrl(els.baseUrl.value);
  storage.set("api.baseUrl", base);
  state.baseUrl = base;

  setStatus("", "Checking…", `Trying ${base}`);
  const started = performance.now();

  try {
    const res = await fetch(`${base}/`, { method: "GET" });
    const ms = Math.round(performance.now() - started);
    if (res.status === 404) {
      setStatus("ok", "Backend reachable", `GET / returned 404 (expected). ${ms}ms`);
      toast("ok", "Connected", "Backend reachable (404 on / is normal).");
      return;
    }
    setStatus("ok", "Backend reachable", `GET / returned ${res.status}. ${ms}ms`);
    toast("ok", "Connected", `Backend reachable (status ${res.status}).`);
  } catch (e) {
    setStatus("bad", "Connection failed", String(e?.message || e));
    toast("bad", "Not connected", "Backend not reachable. Is it running?");
  }
}

async function handleSignup(e) {
  e.preventDefault();
  const name = els.signupName.value.trim();
  const email = els.signupEmail.value.trim();
  const password = els.signupPassword.value;

  try {
    const data = await apiFetch("/signup", { method: "POST", body: { name, email, password } });
    toast("ok", "Account created", "Now login to get your token.");
    els.loginEmail.value = email;
    els.loginPassword.value = password;
    selectTab("login");
    return data;
  } catch (err) {
    toast("bad", "Signup failed", err.message || "Please check inputs.");
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const email = els.loginEmail.value.trim();
  const password = els.loginPassword.value;

  try {
    const data = await apiFetch("/login", { method: "POST", body: { email, password } });
    const token = data?.token || "";
    if (!token) throw new Error("Login succeeded but no token returned.");
    setToken(token);
    toast("ok", "Logged in", "Token saved locally. You can now use Goals APIs.");
  } catch (err) {
    toast("bad", "Login failed", err.message || "Invalid credentials.");
  }
}

function handleLogout() {
  setToken("");
  renderGoalPreview(null);
  toast("warn", "Logged out", "Token cleared.");
}

async function handleCreateGoal(e) {
  e.preventDefault();
  const title = els.goalTitle.value.trim();
  if (!title) return;

  try {
    const res = await apiFetch("/create", { method: "POST", body: { title }, auth: true });
    const goal = res?.data || null;
    if (!goal?._id) throw new Error("Goal created but response didn’t include data._id.");
    upsertLocalGoal(goal);
    els.goalTitle.value = "";
    els.goalId.value = goal._id;
    renderGoalPreview(goal);
    toast("ok", "Goal created", `Saved. _id: ${goal._id}`);
  } catch (err) {
    toast("bad", "Create failed", err.message || "Could not create goal.");
  }
}

async function fetchGoalById(id) {
  if (!id) throw new Error("Goal ID is required.");
  const data = await apiFetch(`/${encodeURIComponent(id)}`, { method: "GET", auth: true });
  const goal = data?.data || null;
  if (!goal?._id) throw new Error("Goal not found.");
  upsertLocalGoal(goal);
  els.goalId.value = goal._id;
  renderGoalPreview(goal);
  return goal;
}

async function toggleGoalCompleted(id) {
  const goal = state.localGoals.find((g) => g._id === id) || state.selectedGoal;
  const next = !Boolean(goal?.completed);
  await apiFetch(`/${encodeURIComponent(id)}`, {
    method: "PUT",
    auth: true,
    body: { completed: next },
  });
  // Backend PUT route returns only message, so re-fetch to keep UI accurate.
  const updated = await fetchGoalById(id);
  toast("ok", "Updated", `completed: ${Boolean(updated.completed)}`);
}

async function deleteGoal(id) {
  await apiFetch(`/${encodeURIComponent(id)}`, { method: "DELETE", auth: true });
  removeLocalGoal(id);
  if (state.selectedGoal?._id === id) renderGoalPreview(null);
  toast("ok", "Deleted", "Goal removed.");
}

function wireTabs() {
  els.tabs.forEach((b) => {
    b.addEventListener("click", () => selectTab(b.dataset.tab));
  });
  els.switchToLoginBtn.addEventListener("click", () => selectTab("login"));
}

function wireGoalsListActions() {
  els.goalsList.addEventListener("click", async (e) => {
    const btn = e.target.closest("button[data-act]");
    if (!btn) return;
    const act = btn.dataset.act;
    const id = btn.dataset.id;
    if (!id) return;

    try {
      if (act === "select") {
        els.goalId.value = id;
        const g = state.localGoals.find((x) => x._id === id) || null;
        renderGoalPreview(g);
      } else if (act === "fetch") {
        await fetchGoalById(id);
        toast("ok", "Fetched", "Goal loaded from backend.");
      } else if (act === "toggle") {
        await toggleGoalCompleted(id);
      } else if (act === "delete") {
        await deleteGoal(id);
      }
    } catch (err) {
      toast("bad", "Action failed", err.message || "Request failed.");
    }
  });
}

function wireGoalOpsButtons() {
  els.fetchBtn.addEventListener("click", async () => {
    const id = els.goalId.value.trim();
    try {
      await fetchGoalById(id);
      toast("ok", "Fetched", "Goal loaded from backend.");
    } catch (err) {
      toast("bad", "Fetch failed", err.message || "Request failed.");
    }
  });

  els.toggleCompleteBtn.addEventListener("click", async () => {
    const id = els.goalId.value.trim();
    try {
      await toggleGoalCompleted(id);
    } catch (err) {
      toast("bad", "Update failed", err.message || "Request failed.");
    }
  });

  els.deleteBtn.addEventListener("click", async () => {
    const id = els.goalId.value.trim();
    if (!id) {
      toast("warn", "Missing ID", "Paste a goal _id first.");
      return;
    }
    try {
      await deleteGoal(id);
    } catch (err) {
      toast("bad", "Delete failed", err.message || "Request failed.");
    }
  });
}

function init() {
  els.baseUrl.value = state.baseUrl;
  setTheme(state.theme);
  setToken(state.token);
  renderGoals();
  renderGoalPreview(null);
  wireTabs();
  wireGoalsListActions();
  wireGoalOpsButtons();

  els.pingBtn.addEventListener("click", pingBackend);
  els.themeBtn.addEventListener("click", () => {
    setTheme(state.theme === "funky" ? "professional" : "funky");
  });

  els.signupForm.addEventListener("submit", handleSignup);
  els.loginForm.addEventListener("submit", handleLogin);
  els.logoutBtn.addEventListener("click", handleLogout);

  els.copyTokenBtn.addEventListener("click", async () => {
    if (!state.token) return;
    try {
      await navigator.clipboard.writeText(state.token);
      toast("ok", "Copied", "Token copied to clipboard.");
    } catch {
      toast("warn", "Copy failed", "Clipboard permission blocked.");
    }
  });

  els.createGoalForm.addEventListener("submit", handleCreateGoal);
  els.clearLocalBtn.addEventListener("click", () => {
    state.localGoals = [];
    saveGoals();
    renderGoals();
    toast("warn", "Cleared", "Local goals list cleared.");
  });

  // Small UX: paste/select goal ID quickly.
  els.goalId.addEventListener("input", () => {
    const id = els.goalId.value.trim();
    const g = state.localGoals.find((x) => x._id === id) || null;
    if (g) renderGoalPreview(g);
  });

  // Try to show “reachable” quickly.
  setTimeout(pingBackend, 300);
}

init();

