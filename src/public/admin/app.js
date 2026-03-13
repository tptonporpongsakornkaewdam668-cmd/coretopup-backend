/* ══════════════════════════════════════════════════
   GAMETOPUP ADMIN CORE ENGINE — PREMUIM V2
   ══════════════════════════════════════════════════ */

const API = "/api";
let adminToken = localStorage.getItem("admin_token");
let ordersData = [];
let usersData = [];

const $ = id => document.getElementById(id);

// ─── MOBILE MENU TOGGLE ──────────────────────────────────────────────────
$("mobile-menu-toggle").onclick = () => {
    document.querySelector(".sidebar").classList.toggle("mobile-open");
};

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
    sliders: { title: "Home Slider", sub: "Manage images and promotional banners for the home page" },
    discounts: { title: "Discount Engine", sub: "Configure promotional codes and usage lifecycle" },
    settings: { title: "Global Configuration", sub: "Manage points system and customer agreements" },
    docs: { title: "API Infrastructure", sub: "System integration and endpoint documentation" }
};

function handleRouting() {
    const hash = window.location.hash.replace("#", "") || "dashboard";
    const pages = document.querySelectorAll(".page");
    const navs = document.querySelectorAll(".nav-item");

    // Close mobile sidebar on route change
    document.querySelector(".sidebar").classList.remove("mobile-open");

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
        if (hash === "sliders") loadSliders();
        if (hash === "discounts") loadDiscounts();
        if (hash === "settings") loadSettings();
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

        const ordersRes = await apiFetch("/admin/orders?limit=6"); // Reduced limit
        const tbody = $("dash-orders-tbody");
        tbody.innerHTML = (ordersRes.data || []).map(o => `
            <tr>
                <td><code class="text-xs font-bold" style="color:var(--text-dim); font-size:10px">#${o.id.slice(0, 8)}</code></td>
                <td>
                    <div class="font-bold">${o.game_name}</div>
                    <div class="text-[10px] text-muted uppercase tracking-tighter">${o.package_name || 'Generic Package'}</div>
                </td>
                <td><span class="font-black" style="color:var(--primary)">฿${o.package_price}</span></td>
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
        { label: "Production Load", count: (statusMap.completed || 0) + (statusMap.success || 0), class: "success" },
        { label: "Active Processing", count: statusMap.processing || 0, class: "info" },
        { label: "Awaiting Attention", count: statusMap.pending || 0, class: "warning" },
        { label: "System Failures", count: statusMap.failed || 0, class: "danger" }
    ];

    bars.innerHTML = items.map(i => {
        const pct = (i.count / total) * 100;
        return `
            <div class="status-row">
                <div class="status-meta">
                    <span>${i.label}</span>
                    <span>${i.count} units</span>
                </div>
                <div class="status-track">
                    <div class="status-fill" style="width:${pct}%; background: var(--${i.class})"></div>
                </div>
            </div>
        `;
    }).join("");
}

// ─── GAMES & PRICING ───────────────────────────────────────────────────────
// ─── GAMES & PRICING ───────────────────────────────────────────────────────
let allGamesData = [];

async function loadGames() {
    const grid = $("games-grid");
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:100px"><div class="loader-pulse"></div><p style="margin-top:20px">Synchronizing catalog...</p></div>';
    showGamesList();

    try {
        const res = await apiFetch("/wepay-game", { method: "POST", body: JSON.stringify({ action: "game_list" }) });
        allGamesData = res.data || [];
        renderGamesGrid(allGamesData);
    } catch (ex) {
        showToast(ex.message, "error");
        grid.innerHTML = `<div class="badge badge-danger">Connection Error: ${ex.message}</div>`;
    }
}

function renderGamesGrid(products) {
    const grid = $("games-grid");
    const groups = {};
    products.forEach(p => {
        if (!groups[p.category]) groups[p.category] = [];
        groups[p.category].push(p);
    });

    const entries = Object.entries(groups);
    grid.innerHTML = entries.map(([cat, items]) => {
        const first = items[0];
        return `
            <div class="game-item-compact glass" onclick='selectGame("${cat.replace(/"/g, "&quot;")}")'>
                <div class="game-card-img-wrap">
                    <img src="${first.img}" class="game-img-lg" onerror="this.src='https://placehold.co/100x100?text=GAME'">
                </div>
                <div class="game-card-footer">
                    <div class="game-card-title">${cat}</div>
                    <div class="game-card-badge">${items.length} Packages</div>
                </div>
            </div>
        `;
    }).join("") || '<div style="grid-column:1/-1;text-align:center;padding:60px">No products match your search.</div>';

    $("games-count").textContent = `${entries.length} Games Available · ${products.length} skus`;
}

function selectGame(categoryName) {
    const items = allGamesData.filter(p => p.category === categoryName);
    const container = $("packages-list-container");
    
    $("selected-game-title").textContent = categoryName;
    $("selected-game-badge").textContent = items[0]?.company_id || "CATALOG";
    
    container.innerHTML = items.map(p => {
        const ov = p.override_data;
        const isPromo = p.is_discount;
        return `
            <div class="pkg-row-large glass ${ov ? 'has-override' : ''}" onclick='openPriceModal(${JSON.stringify(p).replace(/'/g, "&apos;")})'>
                <div class="pkg-info">
                    <div class="font-black text-lg">${p.des || p.name.split('-')[1] || "Standard Pack"}</div>
                    <div class="text-xs text-muted font-mono">ID: ${p.company_id}</div>
                </div>
                <div class="pkg-pricing" style="text-align:right">
                    <div class="font-black text-2xl" style="color:var(--primary)">฿${p.price.toLocaleString()}</div>
                    ${isPromo ? '<div class="badge badge-danger" style="font-size:9px">PROMO ACTIVE</div>' : ''}
                    ${ov && ov.original_price != p.price ? `<div class="text-xs opacity-40 line-through">MSRP ฿${p.base_price}</div>` : ''}
                </div>
            </div>
        `;
    }).join("");

    $("games-list-view").classList.add("hidden");
    $("game-packages-view").classList.remove("hidden");
}

function showGamesList() {
    $("games-list-view").classList.remove("hidden");
    $("game-packages-view").classList.add("hidden");
}

// Search Logic
$("game-search").oninput = (e) => {
    const query = e.target.value.toLowerCase();
    const filtered = allGamesData.filter(p => 
        p.category.toLowerCase().includes(query) || 
        p.name.toLowerCase().includes(query) ||
        p.company_id.toLowerCase().includes(query)
    );
    renderGamesGrid(filtered);
};

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
                <td><code class="text-xs font-black" style="color:var(--primary)">#${o.id.substring(0, 8)}</code></td>
                <td>
                    <div class="font-bold">${o.user_email}</div>
                    <div class="text-[10px] font-mono opacity-60">${o.player_id || 'NO_ID_INFO'}</div>
                </td>
                <td>
                    <div class="font-bold">${o.game_name}</div>
                    <div class="text-xs font-black" style="color:var(--primary)">฿${o.package_price}</div>
                </td>
                <td><code class="text-xs opacity-70">${o.reference || '-'}</code></td>
                <td><span class="badge badge-${getStatusClass(o.status)}">${o.status}</span></td>
                <td><div class="text-xs opacity-60">${new Date(o.created_at).toLocaleDateString()}</div><div class="text-[10px] opacity-40">${new Date(o.created_at).toLocaleTimeString()}</div></td>
                <td><button class="btn btn-s text-xs glass" onclick="openStatusModal('${o.id}', '${o.status}')">Manage</button></td>
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
let selectedUserId = null;
async function loadUsers() {
    try {
        const res = await apiFetch("/admin/users");
        const tbody = $("users-tbody");
        tbody.innerHTML = (res.data || []).map((u, i) => {
            const badgeClass = u.balance > 0 ? 'badge-success' : 'badge-danger';
            return `
            <tr>
                <td>${i + 1}</td>
                <td><div class="font-bold">${u.username}</div></td>
                <td>${u.email}</td>
                <td><button class="btn btn-s" onclick="openBalanceModal('${u.id}', '${u.username}', ${u.balance || 0}, ${u.points || 0})">Edit Profile</button></td>
                <td><span class="${badgeClass}">${u.balance.toLocaleString()} ฿</span></td>
                <td><span class="badge badge-info">${u.points || 0} PTS</span></td>
                <td>${new Date(u.created_at).toLocaleDateString()}</td>
            </tr>
        `;
        }).join("");
    } catch (ex) { showToast(ex.message, "error"); }
}

function openBalanceModal(id, name, currentBalance, currentPoints) {
    selectedUserId = id; // Set selected user ID
    $("balance-modal-title").textContent = `Adjust Fund: ${name}`;
    $("balance-modal-current").textContent = `Current Liquidity: ฿${currentBalance.toLocaleString()}`;
    $("balance-modal-amount").value = currentBalance;
    $("balance-modal-points").value = currentPoints; // New field for points
    $("balance-modal").classList.remove("hidden");

    $("balance-modal-confirm").onclick = async () => {
        try {
            await apiFetch(`/admin/users/${selectedUserId}/balance`, {
                method: "PATCH",
                body: JSON.stringify({ balance: parseFloat($("balance-modal-amount").value) })
            });
            await apiFetch(`/admin/users/${selectedUserId}/points`, {
                method: "PATCH",
                body: JSON.stringify({ points: parseInt($("balance-modal-points").value) })
            });
            showToast("Profile Synchronized", "success");
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

// ─── SLIDER MANAGEMENT ───────────────────────────────────────────────────────
async function loadSliders() {
    const tbody = $("sliders-tbody");
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:40px">Loading sliders...</td></tr>';
    try {
        const res = await apiFetch("/admin/sliders");
        tbody.innerHTML = (res.data || []).map(s => `
            <tr>
                <td><img src="${s.image_url}" style="height:60px; border-radius:8px; border:1px solid var(--border)"></td>
                <td><div style="max-width:200px;overflow:hidden;text-overflow:ellipsis">${s.link_url || '<span class="text-dim">None</span>'}</div></td>
                <td>${s.order_index}</td>
                <td>
                    <button class="btn btn-s btn-danger" onclick="deleteSlider('${s.id}')">Delete</button>
                </td>
            </tr>
        `).join("") || '<tr><td colspan="4" style="text-align:center;padding:40px">No sliders found.</td></tr>';
    } catch (ex) { showToast(ex.message, "error"); }
}

$("add-slider-btn").onclick = () => {
    $("slider-form").reset();
    $("slider-preview").innerHTML = '<span class="text-dim text-xs">Image Preview</span>';
    $("slider-modal").classList.remove("hidden");
};

$("slider-modal-cancel").onclick = () => $("slider-modal").classList.add("hidden");

$("slider-input-file").onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            $("slider-preview").innerHTML = `<img src="${e.target.result}" style="max-width:100%; max-height:100%; object-fit:contain">`;
        };
        reader.readAsDataURL(file);
    }
};

$("slider-form").onsubmit = async (e) => {
    e.preventDefault();
    const btn = $("slider-modal-confirm");
    btn.disabled = true;
    btn.textContent = "Uploading...";

    try {
        const formData = new FormData();
        const fileInput = $("slider-input-file");
        if (fileInput.files.length > 0) {
            formData.append("image", fileInput.files[0]);
        }
        formData.append("link_url", $("slider-input-url").value);
        formData.append("order_index", $("slider-input-order").value);

        // Custom fetch for multipart
        const res = await fetch(API + "/admin/sliders", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${adminToken}`
            },
            body: formData
        });

        const json = await res.json();
        if (!res.ok) throw new Error(json.message || "Upload Failed");

        showToast("Slider Added Successfully", "success");
        $("slider-modal").classList.add("hidden");
        loadSliders();
    } catch (ex) {
        showToast(ex.message, "error");
    } finally {
        btn.disabled = false;
        btn.textContent = "Upload Slide";
    }
};

async function deleteSlider(id) {
    if (!confirm("Are you sure you want to delete this slide?")) return;
    try {
        await apiFetch(`/admin/sliders/delete/${id}`);
        showToast("Slider Deleted", "success");
        loadSliders();
    } catch (ex) { showToast(ex.message, "error"); }
}
async function loadDiscounts() {
    const tbody = $("discounts-tbody");
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px">Decoding promo database...</td></tr>';
    try {
        const res = await apiFetch("/admin/discounts");
        tbody.innerHTML = (res.data || []).map(d => `
            <tr>
                <td><code class="font-bold" style="color:var(--primary)">${d.code}</code></td>
                <td><span class="badge badge-info">${d.type.toUpperCase()}</span></td>
                <td><div class="font-bold">${d.type === 'percent' ? d.value + '%' : '฿' + d.value}</div></td>
                <td>฿${d.min_order_amount || 0}</td>
                <td><span class="badge badge-${d.is_active ? 'success' : 'danger'}">${d.is_active ? 'ACTIVE' : 'INACTIVE'}</span></td>
                <td><div class="text-xs font-bold">${d.usage_count} / ${d.usage_limit || '∞'}</div></td>
                <td>
                    <button class="btn btn-s" onclick='openDiscountModal(${JSON.stringify(d).replace(/'/g, "&apos;")})'>Edit</button>
                    <button class="btn btn-s btn-danger" onclick="deleteDiscount('${d.id}')">Del</button>
                </td>
            </tr>
        `).join("") || '<tr><td colspan="7" style="text-align:center;padding:40px">Zero campaigns active.</td></tr>';
    } catch (ex) { showToast(ex.message, "error"); }
}

let activeDiscountId = null;
$("add-discount-btn").onclick = () => {
    activeDiscountId = null;
    $("discount-modal-title").textContent = "Create Promo Code";
    $("discount-form").reset();
    $("discount-input-active").checked = true;
    $("discount-modal").classList.remove("hidden");
};

function openDiscountModal(d) {
    activeDiscountId = d.id;
    $("discount-modal-title").textContent = "Edit Promo Code: " + d.code;
    $("discount-input-code").value = d.code;
    $("discount-input-type").value = d.type;
    $("discount-input-value").value = d.value;
    $("discount-input-min").value = d.min_order_amount;
    $("discount-input-max").value = d.max_discount || "";
    $("discount-input-limit").value = d.usage_limit || "";
    $("discount-input-end").value = d.end_date ? new Date(d.end_date).toISOString().slice(0, 16) : "";
    $("discount-input-active").checked = d.is_active;
    $("discount-modal").classList.remove("hidden");
}

$("discount-modal-cancel").onclick = () => $("discount-modal").classList.add("hidden");

$("discount-form").onsubmit = async (e) => {
    e.preventDefault();
    const payload = {
        code: $("discount-input-code").value.toUpperCase(),
        type: $("discount-input-type").value,
        value: parseFloat($("discount-input-value").value),
        min_order_amount: parseFloat($("discount-input-min").value) || 0,
        max_discount: parseFloat($("discount-input-max").value) || null,
        usage_limit: parseInt($("discount-input-limit").value) || null,
        end_date: $("discount-input-end").value || null,
        is_active: $("discount-input-active").checked
    };

    try {
        if (activeDiscountId) {
            await apiFetch(`/admin/discounts/${activeDiscountId}`, { method: "PATCH", body: JSON.stringify(payload) });
        } else {
            await apiFetch("/admin/discounts", { method: "POST", body: JSON.stringify(payload) });
        }
        showToast("Campaign Synchronized", "success");
        $("discount-modal").classList.add("hidden");
        loadDiscounts();
    } catch (ex) { showToast(ex.message, "error"); }
};

async function deleteDiscount(id) {
    if (!confirm("Are you sure you want to terminate this promo code?")) return;
    try {
        await apiFetch(`/admin/discounts/${id}`, { method: "DELETE" });
        showToast("Code Purged", "success");
        loadDiscounts();
    } catch (ex) { showToast(ex.message, "error"); }
}

// ─── SETTINGS MANAGEMENT ─────────────────────────────────────────────────────
async function loadSettings() {
    try {
        const res = await apiFetch("/admin/settings");
        const config = res.data || {};
        $("setting-point-threshold").value = config.point_earn_threshold || 100;
        $("setting-point-earn").value = config.point_earn_rate || 1;
        $("setting-point-redeem").value = config.point_redeem_rate || 0.1;
        $("setting-agreement-text").value = config.agreement_text || "";
    } catch (ex) { showToast(ex.message, "error"); }
}

$("settings-points-form").onsubmit = async (e) => {
    e.preventDefault();
    const payload = {
        point_earn_threshold: $("setting-point-threshold").value,
        point_earn_rate: $("setting-point-earn").value,
        point_redeem_rate: $("setting-point-redeem").value
    };
    try {
        await apiFetch("/admin/settings", { method: "PATCH", body: JSON.stringify(payload) });
        showToast("Point Policy Updated", "success");
    } catch (ex) { showToast(ex.message, "error"); }
};

$("settings-agreement-form").onsubmit = async (e) => {
    e.preventDefault();
    const payload = {
        agreement_text: $("setting-agreement-text").value
    };
    try {
        await apiFetch("/admin/settings", { method: "PATCH", body: JSON.stringify(payload) });
        showToast("Agreement Terms Updated", "success");
    } catch (ex) { showToast(ex.message, "error"); }
};
