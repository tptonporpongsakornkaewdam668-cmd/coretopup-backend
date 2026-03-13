/* ══════════════════════════════════════════════════
   GAMETOPUP ADMIN CORE ENGINE — PREMUIM V2
   ══════════════════════════════════════════════════ */

const API = "/api";
let adminToken = localStorage.getItem("admin_token");
let ordersData = [];
let usersData = [];

const $ = id => document.getElementById(id);

// ─── AUTH CHECK ─────────────────────────────────────────────────────────────
if (!adminToken && !window.location.hash.includes("login")) {
    showLogin();
} else if (adminToken) {
    verifyToken();
}

async function verifyToken() {
    try {
        const res = await apiFetch("/admin/verify");
        if (res.success) {
            $("display-admin-email").textContent = res.admin.email;
            initApp();
        } else {
            showLogin();
        }
    } catch (ex) { showLogin(); }
}

function showLogin() {
    $("login-screen").classList.remove("hidden");
    $("app").classList.add("hidden");
}

function initApp() {
    $("login-screen").classList.add("hidden");
    $("app").classList.remove("hidden");
    handleRouting();
    updateDashboardStats();
}

// ─── ROUTING & NAVIGATION ──────────────────────────────────────────────────
window.addEventListener("hashchange", handleRouting);

const PAGE_META = {
    dashboard: { title: "Executive Overview", sub: "Real-time system telemetry and financial status" },
    games: { title: "Inventory & Pricing", sub: "Manage product overrides and promotional campaigns" },
    orders: { title: "Order Management", sub: "Monitor and control transaction lifecycle" },
    users: { title: "User Directory", sub: "View customer profiles and manage wallet liquidity" },
    docs: { title: "API Infrastructure", sub: "System integration and endpoint documentation" }
};

function handleRouting() {
    const hash = window.location.hash.replace("#", "") || "dashboard";
    const pages = document.querySelectorAll(".page");
    const navs = document.querySelectorAll(".nav-item");

    pages.forEach(p => p.classList.remove("active"));
    navs.forEach(n => n.classList.remove("active"));

    const targetPage = $(`page-${hash}`);
    if (targetPage) {
        targetPage.classList.add("active");
        const nav = document.querySelector(`.nav-item[data-page="${hash}"]`);
        if (nav) nav.classList.add("active");

        // Update Title
        const meta = PAGE_META[hash] || PAGE_META.dashboard;
        $("current-page-title").textContent = meta.title;
        $("current-page-subtitle").textContent = meta.sub;

        // Auto Load
        if (hash === "dashboard") updateDashboardStats();
        if (hash === "games") loadGames();
        if (hash === "orders") loadOrders();
        if (hash === "users") loadUsers();
        if (hash === "docs") renderApiDocs();
    }
}

// ─── API WRAPPER ────────────────────────────────────────────────────────────
async function apiFetch(endpoint, options = {}) {
    const headers = {
        "Content-Type": "application/json",
        ...(adminToken ? { "Authorization": `Bearer ${adminToken}` } : {})
    };
    try {
        const res = await fetch(API + endpoint, { ...options, headers });
        const json = await res.json();
        if (res.status === 401) {
            localStorage.removeItem("admin_token");
            window.location.reload();
        }
        if (!res.ok) throw new Error(json.message || "API Request Failed");
        return json;
    } catch (ex) {
        console.error(`[API Error ${endpoint}]:`, ex);
        throw ex;
    }
}

// ─── LOGIN LOGIC ────────────────────────────────────────────────────────────
$("login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = $("login-btn");
    btn.disabled = true;
    btn.textContent = "Authenticating...";

    try {
        const email = $("login-email").value;
        const password = $("login-password").value;
        const res = await apiFetch("/admin/login", {
            method: "POST",
            body: JSON.stringify({ email, password })
        });

        adminToken = res.token;
        localStorage.setItem("admin_token", adminToken);
        showToast("Access Granted", "success");
        initApp();
    } catch (ex) {
        $("login-error").textContent = ex.message;
        $("login-error").classList.remove("hidden");
    } finally {
        btn.disabled = false;
        btn.textContent = "Secure Login";
    }
});

$("logout-btn").onclick = () => {
    localStorage.removeItem("admin_token");
    window.location.reload();
};

// ─── DASHBOARD ─────────────────────────────────────────────────────────────
async function updateDashboardStats() {
    try {
        const res = await apiFetch("/admin/stats");
        const s = res.data;
        $("stat-users").textContent = (s.totalUsers || 0).toLocaleString();
        $("stat-orders").textContent = (s.totalOrders || 0).toLocaleString();
        $("stat-revenue").textContent = (s.ordersByStatus?.completed || s.ordersByStatus?.success || 0).toLocaleString();
        $("stat-pending").textContent = (s.ordersByStatus?.pending || 0).toLocaleString();

        const ordersRes = await apiFetch("/admin/orders?limit=10");
        const tbody = $("dash-orders-tbody");
        tbody.innerHTML = (ordersRes.data || []).map(o => `
            <tr>
                <td><code style="font-size:11px">${o.id}</code></td>
                <td><div style="font-weight:700">${o.game_name}</div></td>
                <td><span style="color:var(--primary);font-weight:800">฿${o.package_price}</span></td>
                <td><span class="badge badge-${getStatusClass(o.status)}">${o.status}</span></td>
            </tr>
        `).join("") || '<tr><td colspan="4" style="text-align:center;padding:40px">Zero records found.</td></tr>';

        renderHealthStatus(s.ordersByStatus);
    } catch (ex) { console.error(ex); }
}

function renderHealthStatus(statusMap = {}) {
    const bars = $("status-bars");
    const total = Object.values(statusMap).reduce((a, b) => a + b, 0) || 1;
    const items = [
        { label: "Completed", count: (statusMap.completed || 0) + (statusMap.success || 0), class: "success" },
        { label: "Processing", count: statusMap.processing || 0, class: "info" },
        { label: "Pending Issues", count: statusMap.pending || 0, class: "warning" },
        { label: "Failed/Canceled", count: statusMap.failed || 0, class: "danger" }
    ];

    bars.innerHTML = items.map(i => {
        const pct = (i.count / total) * 100;
        return `
            <div class="status-item">
                <div style="display:flex;justify-content:space-between;margin-bottom:6px;font-size:12px;font-weight:700">
                    <span>${i.label}</span>
                    <span style="color:var(--text-dim)">${i.count} items</span>
                </div>
                <div style="height:6px;background:var(--sidebar-bg);border-radius:10px;overflow:hidden">
                    <div style="width:${pct}%;height:100%;transition:width 1s;background:var(--${i.class})"></div>
                </div>
            </div>
        `;
    }).join("");
}

// ─── GAMES & PRICING ───────────────────────────────────────────────────────
async function loadGames() {
    const grid = $("games-grid");
    grid.innerHTML = '<div class="stat-card" style="grid-column:1/-1;text-align:center">Indexing game database...</div>';

    try {
        const res = await apiFetch("/wepay-game", { method: "POST", body: JSON.stringify({ action: "game_list" }) });
        const products = res.data || [];

        const groups = {};
        products.forEach(p => {
            if (!groups[p.category]) groups[p.category] = [];
            groups[p.category].push(p);
        });

        grid.innerHTML = Object.entries(groups).map(([cat, items]) => {
            const first = items[0];
            return `
                <div class="game-item">
                    <div class="game-header">
                        <div class="game-img-wrap" onclick='openGameModal(${JSON.stringify(first).replace(/'/g, "&apos;")})' title="คลิกเพื่อแก้ไขรูปภาพ/ชื่อเกม" style="position:relative; cursor:pointer; width:56px; height:56px;">
                            <img src="${first.img}" class="game-img" style="width:100%; height:100%;" onerror="this.src='https://placehold.co/100x100?text=GAME'">
                            <div class="img-edit-overlay" style="position:absolute; inset:0; background:rgba(0,0,0,0.4); display:flex; align-items:center; justify-content:center; opacity:0; transition:0.2s; border-radius:12px;">
                                <svg viewBox="0 0 24 24" width="16" height="16" stroke="#fff" fill="none" stroke-width="2.5"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                            </div>
                            <style>.game-img-wrap:hover .img-edit-overlay { opacity: 1; }</style>
                        </div>
                        <div class="game-info-main">
                            <div class="game-name-text">${cat}</div>
                            <span class="game-tag">Inventory: ${items.length}</span>
                        </div>
                    </div>
                    <div class="package-list">
                        ${items.map(p => {
                const ov = p.override_data;
                const isPromo = p.is_discount;
                return `
                                <div class="pkg-row ${ov ? 'has-override' : ''}" onclick='openPriceModal(${JSON.stringify(p).replace(/'/g, "&apos;")})'>
                                    <div class="pkg-title">${p.des || p.name.split('-')[1] || "Default Pack"}</div>
                                    <div class="pkg-prices">
                                        <div class="pkg-final">฿${p.price.toLocaleString()}</div>
                                        ${isPromo ? '<div class="pkg-promo-tag">FLASH SALE</div>' : ''}
                                        ${ov && ov.original_price != p.price ? `<div class="pkg-base">฿${p.base_price}</div>` : ''}
                                    </div>
                                </div>
                            `;
            }).join("")}
                    </div>
                </div>
            `;
        }).join("");

        $("games-count").textContent = `${Object.keys(groups).length} Active Games · ${products.length} Packages`;
    } catch (ex) {
        showToast(ex.message, "error");
        grid.innerHTML = `<div class="badge badge-danger">Connection Error: ${ex.message}</div>`;
    }
}

// ─── PRICE MODAL LOGIC ───
let selectedProduct = null;
function openPriceModal(p) {
    selectedProduct = p;
    const ov = p.override_data || {};
    $("price-modal-title").textContent = `Configure Pricing: ${p.category}`;
    $("price-modal-subtitle").textContent = `SKU ID: ${p.id} | ORIG: ${p.base_price}`;

    $("price-modal-original").value = p.base_price;
    $("price-modal-cost").value = ov.cost_price || "";
    $("price-modal-selling").value = ov.selling_price || p.base_price;
    $("price-modal-discount").value = ov.discount_price || "";

    const formatDate = d => d ? new Date(d).toISOString().slice(0, 16) : "";
    $("price-modal-start").value = formatDate(ov.discount_start);
    $("price-modal-end").value = formatDate(ov.discount_end);

    $("price-modal").classList.remove("hidden");
}

$("price-modal-cancel").onclick = () => $("price-modal").classList.add("hidden");
$("price-modal-confirm").onclick = async () => {
    const payload = {
        company_id: selectedProduct.original_id,
        original_price: selectedProduct.base_price,
        cost_price: parseFloat($("price-modal-cost").value) || null,
        selling_price: parseFloat($("price-modal-selling").value) || null,
        discount_price: parseFloat($("price-modal-discount").value) || null,
        discount_start: $("price-modal-start").value || null,
        discount_end: $("price-modal-end").value || null
    };
    try {
        await apiFetch("/admin/products/override", { method: "PATCH", body: JSON.stringify(payload) });
        showToast("Configurations Applied", "success");
        $("price-modal").classList.add("hidden");
        loadGames();
    } catch (ex) { showToast(ex.message, "error"); }
};

// ─── ORDERS ────────────────────────────────────────────────────────────────
async function loadOrders() {
    try {
        const res = await apiFetch("/admin/orders?limit=100");
        const tbody = $("orders-tbody");
        tbody.innerHTML = (res.data || []).map(o => `
            <tr>
                <td><code class="text-xs font-bold">${o.id.substring(0, 8)}...</code></td>
                <td><div class="font-bold">${o.user_email}</div><div class="text-xs opacity-50">${o.player_id}</div></td>
                <td><div class="font-bold">${o.game_name}</div><div class="text-green font-bold">฿${o.package_price}</div></td>
                <td><code class="text-xs">${o.reference || '-'}</code></td>
                <td><span class="badge badge-${getStatusClass(o.status)}">${o.status}</span></td>
                <td class="text-xs opacity-50">${new Date(o.created_at).toLocaleString()}</td>
                <td><button class="btn btn-s text-xs" onclick="openStatusModal('${o.id}', '${o.status}')">Update</button></td>
            </tr>
        `).join("");
    } catch (ex) { showToast(ex.message, "error"); }
}

function getStatusClass(s) {
    if (["completed", "success"].includes(s)) return "success";
    if (s === "processing") return "info";
    if (s === "failed") return "danger";
    return "warning";
}

let activeOrderId = null;
function openStatusModal(id, current) {
    activeOrderId = id;
    $("modal-order-id").textContent = `#${id}`;
    $("modal-status").value = current;
    $("modal").classList.remove("hidden");
}
$("modal-cancel").onclick = () => $("modal").classList.add("hidden");
$("modal-confirm").onclick = async () => {
    const status = $("modal-status").value;
    try {
        await apiFetch(`/admin/orders/${activeOrderId}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
        showToast("Status Synchronized", "success");
        $("modal").classList.add("hidden");
        loadOrders();
    } catch (ex) { showToast(ex.message, "error"); }
};

// ─── USERS ────────────────────────────────────────────────────────────────
async function loadUsers() {
    try {
        const res = await apiFetch("/admin/users");
        const tbody = $("users-tbody");
        tbody.innerHTML = (res.data || []).map((u, i) => `
            <tr>
                <td>${i + 1}</td>
                <td><div class="font-bold">${u.username}</div></td>
                <td>${u.email}</td>
                <td><button class="btn btn-s" onclick="openBalanceModal('${u.id}', '${u.username}', ${u.balance || 0})">฿${(u.balance || 0).toLocaleString()}</button></td>
                <td class="text-xs opacity-50">${new Date(u.created_at).toLocaleDateString()}</td>
            </tr>
        `).join("");
    } catch (ex) { showToast(ex.message, "error"); }
}

function openBalanceModal(id, name, current) {
    $("balance-modal-title").textContent = `Adjust Fund: ${name}`;
    $("balance-modal-current").textContent = `Current Liquidity: ฿${current.toLocaleString()}`;
    $("balance-modal-amount").value = current;
    $("balance-modal").classList.remove("hidden");

    $("balance-modal-confirm").onclick = async () => {
        const amount = parseFloat($("balance-modal-amount").value);
        try {
            await apiFetch(`/admin/users/${id}/balance`, { method: "PATCH", body: JSON.stringify({ balance: amount }) });
            showToast("Balance Protocol Confirmed", "success");
            $("balance-modal").classList.add("hidden");
            loadUsers();
        } catch (ex) { showToast(ex.message, "error"); }
    };
}
$("balance-modal-cancel").onclick = () => $("balance-modal").classList.add("hidden");

// ─── API DOCS ─────────────────────────────────────────────────────────────
function renderApiDocs() {
    const content = $("api-docs-content");
    content.innerHTML = `
        <div class="card">
            <h3 class="card-title" style="margin-bottom:20px">Production Endpoints</h3>
            <div class="package-list" style="gap:20px">
                <div class="endpoint-row" style="display:flex;gap:20px;padding:20px;background:var(--surface);border-radius:12px;border:1px solid var(--border)">
                    <span class="badge badge-info" style="min-width:70px">POST</span>
                    <div>
                        <code class="font-bold">/api/wepay-game</code>
                        <p class="text-xs opacity-50 mt-1">Provider Integration Engine for Catalog & Purchase</p>
                    </div>
                </div>
                <!-- More items can be added here -->
            </div>
        </div>
    `;
}

// ─── TOAST SYSTEM ──────────────────────────────────────────────────────────
function showToast(msg, type = "info") {
    const t = $("toast");
    t.textContent = msg;
    t.className = `toast ${type}`;
    t.style.opacity = "1";
    t.style.transform = "translateY(0)";

    setTimeout(() => {
        t.style.opacity = "0";
        t.style.transform = "translateY(100px)";
    }, 4000);
}
// ─── GAME SETTINGS MODAL LOGIC ───
let selectedGame = null;
function openGameModal(p) {
    selectedGame = p;
    const gs = p.setting_data || {};

    $("game-modal-id").textContent = `Company ID: ${p.original_id}`;
    $("game-modal-name").value = gs.custom_name || p.category;
    $("game-modal-image").value = gs.custom_image_url || p.img;

    updateImagePreview();
    $("game-modal").classList.remove("hidden");
}

$("game-modal-image").oninput = updateImagePreview;
function updateImagePreview() {
    const url = $("game-modal-image").value;
    const preview = $("game-modal-preview");
    if (url) {
        preview.innerHTML = `<img src="${url}" style="max-width:100%; max-height:100%; object-fit:contain" onerror="this.src='https://placehold.co/100x100?text=ERROR'">`;
    } else {
        preview.innerHTML = `<span class="text-dim text-xs">Image Preview</span>`;
    }
}

$("game-modal-cancel").onclick = () => $("game-modal").classList.add("hidden");
$("game-modal-confirm").onclick = async () => {
    try {
        await apiFetch("/admin/games/settings", {
            method: "PATCH",
            body: JSON.stringify({
                company_id: selectedGame.original_id,
                custom_name: $("game-modal-name").value,
                custom_image_url: $("game-modal-image").value
            })
        });
        showToast("Update Game Settings Successful", "success");
        $("game-modal").classList.add("hidden");
        loadGames();
    } catch (ex) { showToast(ex.message, "error"); }
};
