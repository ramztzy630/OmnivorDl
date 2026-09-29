/* ============================================================
   TEMP MAIL - mailgenerator.js
   Sumber data: mail.tm (https://mail.tm) — gratis, tanpa API key,
   CORS didukung langsung dari browser. Limit resmi: 8 request/detik
   per IP, jauh di atas kebutuhan kita (polling tiap 8 detik).
   Dibungkus IIFE. State hanya di memory (tidak pakai localStorage).
   ============================================================ */
(function () {
    "use strict";

    // ---------- Konfigurasi ----------
    var API_BASE = "https://api.mail.tm";
    var AUTO_REFRESH_MS = 8000;   // polling inbox tiap 8 detik
    var LOGIN_LENGTH = 10;
    var PASSWORD_LENGTH = 16;
    var MAX_ACCOUNT_RETRY = 3;    // percobaan ulang kalau alamat/domain kebetulan bentrok

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
    var currentAddress = null;
    var currentToken = null;
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

    function randomString(len) {
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

    // Ubah HTML email jadi teks polos yang aman (tanpa menjalankan script apapun)
    function htmlToText(html) {
        var div = document.createElement("div");
        div.innerHTML = html;
        div.querySelectorAll("script, style").forEach(function (el) { el.remove(); });
        return div.textContent.replace(/\n{3,}/g, "\n\n").trim();
    }

    // Fetch JSON dengan penanganan HTTP error, JSON tidak valid, dan retry
    // otomatis untuk kegagalan jaringan sesaat.
    async function apiFetch(path, options, retries) {
        if (retries === undefined) retries = 2;
        var opts = options || {};

        for (var attempt = 0; attempt <= retries; attempt++) {
            try {
                var res = await fetch(API_BASE + path, opts);
                var body = null;
                try { body = await res.json(); } catch (e) { body = null; }

                if (!res.ok) {
                    var err = new Error("HTTP " + res.status);
                    err.status = res.status;
                    err.body = body;
                    throw err;
                }
                return body;
            } catch (err) {
                var isLastAttempt = attempt === retries;
                // Error dari status HTTP (4xx/5xx) tidak perlu diulang-ulang,
                // cuma kegagalan jaringan murni ("Failed to fetch") yang di-retry.
                var isNetworkError = !err.status;
                if (isLastAttempt || !isNetworkError) throw err;
                await new Promise(function (r) { setTimeout(r, 700); });
            }
        }
    }

    function jsonHeaders(token) {
        var h = { "Content-Type": "application/json" };
        if (token) h["Authorization"] = "Bearer " + token;
        return h;
    }

    // ---------- Generate email ----------
    async function generateEmail() {
        generateBtn.disabled = true;
        refreshBtn.disabled = true;
        setStatus("", "Membuat alamat email...");
        stopPolling();
        knownIds.clear();
        resetInbox();
        currentToken = null;
        currentAddress = null;

        try {
            var domainData = await apiFetch("/domains");
            var domains = (domainData && domainData["hydra:member"] || [])
                .filter(function (d) { return d.isActive; })
                .map(function (d) { return d.domain; });

            if (domains.length === 0) throw new Error("Tidak ada domain aktif dari mail.tm");

            var account = null;
            var lastErr = null;

            for (var attempt = 0; attempt < MAX_ACCOUNT_RETRY && !account; attempt++) {
                var domain = domains[Math.floor(Math.random() * domains.length)];
                var login = randomString(LOGIN_LENGTH);
                var password = randomString(PASSWORD_LENGTH);
                var address = login + "@" + domain;

                try {
                    await apiFetch("/accounts", {
                        method: "POST",
                        headers: jsonHeaders(),
                        body: JSON.stringify({ address: address, password: password })
                    });
                    account = { address: address, password: password };
                } catch (e) {
                    lastErr = e; // kemungkinan kecil alamat bentrok atau domain baru saja nonaktif, coba lagi
                }
            }

            if (!account) throw (lastErr || new Error("Gagal membuat akun email"));

            var tokenRes = await apiFetch("/token", {
                method: "POST",
                headers: jsonHeaders(),
                body: JSON.stringify({ address: account.address, password: account.password })
            });

            currentAddress = account.address;
            currentToken = tokenRes.token;

            emailDisplay.textContent = currentAddress;
            refreshBtn.disabled = false;
            setStatus("live", "Email aktif, inbox dipantau otomatis");
            showToast("Email baru berhasil dibuat");
            startPolling();
        } catch (err) {
            setStatus("off", "Gagal membuat email");
            emailDisplay.textContent = "Terjadi kesalahan. Coba lagi.";
            showToast("Gagal membuat email, coba lagi sebentar lagi");
        } finally {
            generateBtn.disabled = false;
        }
    }

    // ---------- Inbox ----------
    async function checkInbox(manual) {
        if (!currentToken) return;

        var myRequest = ++inboxRequestId;
        var tokenAtStart = currentToken;

        try {
            var data = await apiFetch("/messages", {
                headers: jsonHeaders(tokenAtStart)
            });

            // Abaikan kalau user sudah generate email baru saat request berjalan
            if (myRequest !== inboxRequestId || tokenAtStart !== currentToken) return;

            var messages = (data && data["hydra:member"]) || [];
            renderInbox(messages);
            if (manual) showToast("Inbox diperbarui");
        } catch (err) {
            if (manual) {
                var pesan = err.status
                    ? "Gagal cek inbox: HTTP " + err.status
                    : "Server email sementara sedang sibuk, coba lagi sebentar lagi";
                showToast(pesan);
            }
            // polling otomatis tetap lanjut walau satu request gagal
        }
    }

    function renderInbox(messages) {
        if (messages.length === 0) {
            resetInbox();
            return;
        }

        msgCount.textContent = messages.length + " pesan";
        messages.sort(function (a, b) {
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        var hadKnown = knownIds.size > 0;
        var hasNew = messages.some(function (m) { return !knownIds.has(m.id); });

        inbox.innerHTML = "";
        messages.forEach(function (m) {
            var fromLabel = (m.from && (m.from.name || m.from.address)) || "-";
            var item = makeEl("button", "tm-msg");
            item.type = "button";
            item.appendChild(makeEl("div", "tm-msg-from", fromLabel));
            item.appendChild(makeEl("div", "tm-msg-subject", m.subject || "(Tanpa subjek)"));
            item.appendChild(makeEl("div", "tm-msg-date", formatDate(m.createdAt)));
            item.addEventListener("click", function () { openMessage(m.id); });
            inbox.appendChild(item);
            knownIds.add(m.id);
        });

        if (hasNew && hadKnown) showToast("Pesan baru masuk");
    }

    function formatDate(iso) {
        if (!iso) return "";
        try {
            var d = new Date(iso);
            return d.toLocaleString("id-ID", {
                day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"
            });
        } catch (e) {
            return iso;
        }
    }

    async function openMessage(id) {
        modalSubject.textContent = "Memuat...";
        modalMeta.textContent = "";
        modalBody.textContent = "";
        modalBg.classList.add("tm-show");

        try {
            var data = await apiFetch("/messages/" + encodeURIComponent(id), {
                headers: jsonHeaders(currentToken)
            });

            var fromLabel = (data.from && (data.from.name || data.from.address)) || "-";
            modalSubject.textContent = data.subject || "(Tanpa subjek)";
            modalMeta.textContent = "Dari: " + fromLabel + "  |  " + formatDate(data.createdAt);

            if (data.text && data.text.trim()) {
                modalBody.textContent = data.text;
            } else if (Array.isArray(data.html) && data.html.length > 0) {
                modalBody.textContent = htmlToText(data.html.join("\n"));
            } else {
                modalBody.textContent = "(Isi pesan kosong)";
            }
        } catch (err) {
            modalSubject.textContent = "Gagal memuat pesan";
            modalBody.textContent = err.status
                ? "Error: HTTP " + err.status
                : "Server email sementara sedang sibuk, coba lagi sebentar lagi";
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
        if (!currentAddress) {
            showToast("Belum ada email untuk disalin");
            return;
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(currentAddress)
                .then(function () { showToast("Email disalin"); })
                .catch(function () { fallbackCopy(currentAddress); });
        } else {
            fallbackCopy(currentAddress);
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

    // ---------- Atribusi mail.tm ----------
    // Ketentuan pemakaian API mail.tm mewajibkan link balik yang terlihat.
    function addAttribution() {
        var layout = document.querySelector("#tempmail .tm-layout");
        if (!layout || document.getElementById("tmAttribution")) return;

        var p = makeEl("p", "tm-note");
        p.id = "tmAttribution";
        p.appendChild(document.createTextNode("Data email disediakan oleh "));

        var a = document.createElement("a");
        a.href = "https://mail.tm";
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.textContent = "mail.tm";
        p.appendChild(a);
        p.appendChild(document.createTextNode("."));

        layout.appendChild(p);
    }
    addAttribution();

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
        if (!currentToken) return;
        if (document.hidden) {
            stopPolling();
        } else {
            checkInbox(false);
            startPolling();
        }
    });
})();
