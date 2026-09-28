/* ============================================================
   TEMP MAIL - tempmail.js
   Dibungkus IIFE, tidak menambah variabel global.
   State hanya disimpan di memory (tidak pakai localStorage).
   ============================================================ */
(function () {
    "use strict";

    // ---------- Konfigurasi ----------
    var API_BASE = "https://www.1secmail.com/api/v1/";
    var DOMAINS_FALLBACK = ["1secmail.com", "1secmail.org", "1secmail.net"];
    var AUTO_REFRESH_MS = 8000;   // polling inbox tiap 8 detik
    var LOGIN_LENGTH = 10;

    // ---------- Elemen ----------
    var emailDisplay = document.getElementById("tmEmailDisplay");
    var copyBtn      = document.getElementById("tmCopyBtn");
    var generateBtn  = document.getElementById("tmGenerateBtn");
    var refreshBtn   = document.getElementById("tmRefreshBtn");
    var statusDot    = document.getElementById("tmStatusDot");
    var statusText   = document.getElementById("tmStatusText");
    var inbox        = document.getElementById("tmInbox");
    var msgCount     = document.getElementById("tmMsgCount");
    var toast        = document.getElementById("tmToast");

    var modalBg      = document.getElementById("tmModalBg");
    var modalSubject = document.getElementById("tmModalSubject");
    var modalMeta    = document.getElementById("tmModalMeta");
    var modalBody    = document.getElementById("tmModalBody");
    var modalClose   = document.getElementById("tmModalClose");
    var modalX       = document.getElementById("tmModalX");

    // Kalau HTML temp mail belum ditempel, berhenti tanpa error
    if (!emailDisplay || !generateBtn || !inbox) return;

    // ---------- State ----------
    var currentLogin = null;
    var currentDomain = null;
    var pollTimer = null;
    var toastTimer = null;
    var knownIds = new Set();
    var inboxRequestId = 0;   // untuk mengabaikan respons inbox yang sudah basi

    // ---------- Util ----------
    function showToast(msg) {
        toast.textContent = msg;
        toast.classList.add("tm-show");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () {
            toast.classList.remove("tm-show");
        }, 2000);
    }

    function randomLogin(len) {
        var chars = "abcdefghijklmnopqrstuvwxyz0123456789";
        var out = "";
        var buf = new Uint32Array(len);
        (window.crypto || window.msCrypto).getRandomValues(buf);
        for (var i = 0; i < len; i++) {
            out += chars[buf[i] % chars.length];
        }
        return out;
    }

    function setStatus(state, text) {
        statusDot.className = "tm-dot" +
            (state === "live" ? " tm-dot-live" : state === "off" ? " tm-dot-off" : "");
        statusText.textContent = text;
    }

    function resetInbox() {
        inbox.innerHTML = '<div class="tm-inbox-empty">Belum ada pesan masuk.</div>';
        msgCount.textContent = "";
    }

    function makeEl(tag, className, text) {
        var el = document.createElement(tag);
        if (className) el.className = className;
        if (text != null) el.textContent = text;
        return el;
    }

    // Fetch JSON dengan penanganan HTTP error & JSON tidak valid
    async function getJson(url) {
        var res = await fetch(url);
        if (!res.ok) throw new Error("HTTP " + res.status);
        try {
            return await res.json();
        } catch (e) {
            throw new Error("Respons bukan JSON valid");
        }
    }

    // ---------- Generate email ----------
    async function generateEmail() {
        generateBtn.disabled = true;
        refreshBtn.disabled = true;
        setStatus("", "Membuat alamat email...");
        stopPolling();
        knownIds.clear();
        resetInbox();

        var domains = DOMAINS_FALLBACK;
        try {
            var list = await getJson(API_BASE + "?action=getDomainList");
            if (Array.isArray(list) && list.length > 0) domains = list;
        } catch (e) {
            // gagal ambil daftar domain: pakai fallback
        }

        currentLogin  = randomLogin(LOGIN_LENGTH);
        currentDomain = domains[Math.floor(Math.random() * domains.length)];

        emailDisplay.textContent = currentLogin + "@" + currentDomain;
        refreshBtn.disabled = false;
        generateBtn.disabled = false;

        setStatus("live", "Email aktif, inbox dipantau otomatis");
        showToast("Email baru berhasil dibuat");
        startPolling();
    }

    // ---------- Inbox ----------
    async function checkInbox(manual) {
        if (!currentLogin || !currentDomain) return;

        var myRequest = ++inboxRequestId;
        var loginAtStart = currentLogin;
        var domainAtStart = currentDomain;

        try {
            var data = await getJson(
                API_BASE +
                "?action=getMessages" +
                "&login=" + encodeURIComponent(loginAtStart) +
                "&domain=" + encodeURIComponent(domainAtStart)
            );

            // Abaikan kalau user sudah generate email baru saat request berjalan
            if (myRequest !== inboxRequestId ||
                loginAtStart !== currentLogin ||
                domainAtStart !== currentDomain) return;

            if (!Array.isArray(data)) throw new Error("Format respons tidak dikenali");

            renderInbox(data);
            if (manual) showToast("Inbox diperbarui");
        } catch (err) {
            if (manual) showToast("Gagal cek inbox: " + err.message);
            // polling otomatis tetap lanjut walau satu request gagal
        }
    }

    function renderInbox(messages) {
        if (messages.length === 0) {
            resetInbox();
            return;
        }

        msgCount.textContent = messages.length + " pesan";
        messages.sort(function (a, b) { return (b.id || 0) - (a.id || 0); });

        var hadKnown = knownIds.size > 0;
        var hasNew = messages.some(function (m) { return !knownIds.has(m.id); });

        inbox.innerHTML = "";
        messages.forEach(function (m) {
            var item = makeEl("button", "tm-msg");
            item.type = "button";
            item.appendChild(makeEl("div", "tm-msg-from", m.from || "-"));
            item.appendChild(makeEl("div", "tm-msg-subject", m.subject || "(Tanpa subjek)"));
            item.appendChild(makeEl("div", "tm-msg-date", m.date || ""));
            item.addEventListener("click", function () { openMessage(m.id); });
            inbox.appendChild(item);
            knownIds.add(m.id);
        });

        if (hasNew && hadKnown) showToast("Pesan baru masuk");
    }

    async function openMessage(id) {
        modalSubject.textContent = "Memuat...";
        modalMeta.textContent = "";
        modalBody.textContent = "";
        modalBg.classList.add("tm-show");

        try {
            var data = await getJson(
                API_BASE +
                "?action=readMessage" +
                "&login=" + encodeURIComponent(currentLogin) +
                "&domain=" + encodeURIComponent(currentDomain) +
                "&id=" + encodeURIComponent(id)
            );

            modalSubject.textContent = data.subject || "(Tanpa subjek)";
            modalMeta.textContent = "Dari: " + (data.from || "-") + "  |  " + (data.date || "-");
            modalBody.textContent = data.textBody || data.body || "(Isi pesan kosong atau hanya berupa HTML)";
        } catch (err) {
            modalSubject.textContent = "Gagal memuat pesan";
            modalBody.textContent = "Error: " + err.message;
        }
    }

    function closeModal() {
        modalBg.classList.remove("tm-show");
    }

    // ---------- Polling ----------
    function startPolling() {
        stopPolling();
        pollTimer = setInterval(function () { checkInbox(false); }, AUTO_REFRESH_MS);
    }

    function stopPolling() {
        if (pollTimer) clearInterval(pollTimer);
        pollTimer = null;
    }

    // ---------- Copy ----------
    function copyEmail() {
        if (!currentLogin) {
            showToast("Belum ada email untuk disalin");
            return;
        }
        var email = currentLogin + "@" + currentDomain;

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(email)
                .then(function () { showToast("Email disalin"); })
                .catch(function () { fallbackCopy(email); });
        } else {
            fallbackCopy(email);
        }
    }

    // Cadangan untuk browser/WebView yang belum mendukung Clipboard API
    function fallbackCopy(text) {
        var ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        var ok = false;
        try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
        document.body.removeChild(ta);
        showToast(ok ? "Email disalin" : "Gagal menyalin, salin manual ya");
    }

    // ---------- Buka section lewat card di "Semua Tools" ----------
    var section = document.getElementById("tempmail");
    var toolCard = document.getElementById("tempMailCard");
    if (toolCard && section) {
        toolCard.addEventListener("click", function (e) {
            e.preventDefault();
            section.classList.add("tm-open");
            section.scrollIntoView({ behavior: "smooth", block: "start" });
        });
    }

    // ---------- Event ----------
    generateBtn.addEventListener("click", generateEmail);
    refreshBtn.addEventListener("click", function () { checkInbox(true); });
    copyBtn.addEventListener("click", copyEmail);

    modalClose.addEventListener("click", closeModal);
    modalX.addEventListener("click", closeModal);
    modalBg.addEventListener("click", function (e) {
        if (e.target === modalBg) closeModal();
    });
    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") closeModal();
    });

    // Hentikan polling saat tab tidak aktif, lanjut saat aktif lagi
    document.addEventListener("visibilitychange", function () {
        if (!currentLogin) return;
        if (document.hidden) {
            stopPolling();
        } else {
            checkInbox(false);
            startPolling();
        }
    });
})();
