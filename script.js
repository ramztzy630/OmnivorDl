// =========================
// DETEKSI DEVICE & BROWSER (buat status card portal)
// =========================

(function detectDeviceAndBrowser() {

    const deviceEl = document.getElementById("deviceValue");
    const browserEl = document.getElementById("browserValue");

    if (!deviceEl || !browserEl) return;

    const ua = navigator.userAgent;

    let device = "Unknown";
    if (/android/i.test(ua)) device = "Android";
    else if (/iphone|ipad|ipod/i.test(ua)) device = "iOS";
    else if (/windows/i.test(ua)) device = "Windows";
    else if (/macintosh|mac os/i.test(ua)) device = "macOS";
    else if (/linux/i.test(ua)) device = "Linux";

    deviceEl.textContent = device;

    let browser = "Unknown";
    if (/edg/i.test(ua)) browser = "Edge";
    else if (/opr|opera/i.test(ua)) browser = "Opera";
    else if (/chrome/i.test(ua) && !/edg/i.test(ua)) browser = "Chrome";
    else if (/firefox/i.test(ua)) browser = "Firefox";
    else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = "Safari";

    browserEl.textContent = browser;

})();


// =========================
// REVEAL FORM DOWNLOAD SAAT KARTU "MEDIA DOWNLOADER" DIKLIK
// =========================

(function setupMediaDownloaderReveal() {

    const card = document.getElementById("mediaDownloaderCard");
    const mainContent = document.querySelector("main");
    const heroSection = document.getElementById("home");

    if (!card || !mainContent || !heroSection) return;

    card.addEventListener("click", (event) => {

        event.preventDefault();

        mainContent.classList.add("reveal");

        heroSection.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    });

})();


// =========================
// MODAL: ABOUT DEV
// =========================

(function setupAboutDevModal() {

    const link = document.getElementById("aboutDevLink");
    const modal = document.getElementById("aboutDevModal");
    const closeBtn = document.getElementById("closeAboutDev");

    if (!link || !modal || !closeBtn) return;

    link.addEventListener("click", (event) => {
        event.preventDefault();
        modal.classList.add("show");
    });

    closeBtn.addEventListener("click", () => {
        modal.classList.remove("show");
    });

    modal.addEventListener("click", (event) => {
        if (event.target === modal) {
            modal.classList.remove("show");
        }
    });

})();


const urlInput = document.getElementById("urlInput");
const downloadBtn = document.getElementById("downloadBtn");
const clearBtn = document.getElementById("clearBtn");


// =========================
// PLATFORM DETECTION
// =========================

function detectPlatform(url) {

    try {

        const parsedUrl = new URL(url);
        const hostname = parsedUrl.hostname.toLowerCase();

        if (hostname.includes("tiktok.com") || hostname.includes("vm.tiktok.com") || hostname.includes("vt.tiktok.com")) {
            return "TikTok";
        }
        if (hostname.includes("instagram.com") || hostname.includes("instagr.am")) {
            return "Instagram";
        }
        if (hostname.includes("facebook.com") || hostname.includes("fb.watch")) {
            return "Facebook";
        }
        if (hostname.includes("pinterest.com") || hostname.includes("pin.it")) {
            return "Pinterest";
        }
        if (hostname.includes("youtube.com") || hostname.includes("youtu.be")) {
            return "YouTube";
        }

        return null;

    } catch (error) {
        return null;
    }
}


// =========================
// INPUT UI
// =========================

function updateInputUI() {

    if (urlInput.value.trim() !== "") {
        clearBtn.style.display = "block";
    } else {
        clearBtn.style.display = "none";
    }

}

urlInput.addEventListener("input", updateInputUI);


// =========================
// CLEAR BUTTON
// =========================

clearBtn.addEventListener("click", () => {
    urlInput.value = "";
    updateInputUI();
    urlInput.focus();
});


// =========================
// DOWNLOAD BUTTON
// =========================

downloadBtn.addEventListener("click", processDownload);


// =========================
// ENTER KEY
// =========================

urlInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        processDownload();
    }
});


// =========================
// MAIN PROCESS
// =========================

async function processDownload() {

    const url = urlInput.value.trim();

    if (!url) {
        showMessage("Masukkan link terlebih dahulu.", "error");
        urlInput.focus();
        return;
    }

    const platform = detectPlatform(url);

    if (!platform) {
        showMessage("Link tidak dikenali. Gunakan link TikTok, Instagram, Facebook, Pinterest, atau YouTube.", "error");
        return;
    }

    downloadBtn.classList.add("loading");
    downloadBtn.innerHTML = `Processing<span>↻</span>`;

    await new Promise(resolve => setTimeout(resolve, 1000));

    showResult(platform, url);
    showMessage(`Link ${platform} berhasil dikenali.`, "success");

    downloadBtn.classList.remove("loading");
    downloadBtn.innerHTML = `Download<span>↓</span>`;

    const defaultFormat = document.getElementById("formatSelect").value;
    const defaultQuality = document.getElementById("qualitySelect").value;

    fetchAndShowPreview(url, platform, defaultFormat, defaultQuality);

}


// =========================
// FETCH & SHOW PREVIEW
// =========================

async function fetchAndShowPreview(url, platform, format, quality) {

    const thumbnail = document.getElementById("thumbnail");

    if (thumbnail) {
        thumbnail.innerHTML = `
            <div style="display:flex;flex-direction:column;align-items:center;gap:10px;color:#8b98a5;">
                <span style="font-size:24px;display:inline-block;animation:spin 0.8s linear infinite;">↻</span>
                <span style="font-size:12px;">Memuat pratinjau video...</span>
            </div>
        `;
    }

    try {

        const response = await fetch("/api/download", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url, platform, format, quality })
        });

        const data = await response.json();

        if (!response.ok) {
            resetThumbnailToDefault();
            showMessage(data.message || "Request gagal.", "error");
            if (data.error) alert("ERROR DETAIL:\n\n" + data.error);
            return;
        }

        if (data.success && data.data && data.data.videoUrl) {
            showDownloadLink(data.data.videoUrl, data.data.title, format);
        } else {
            resetThumbnailToDefault();
            showMessage(data.message || "Video tidak ditemukan atau link tidak valid.", "error");
            if (data.debug) alert("DEBUG INFO:\n\n" + JSON.stringify(data.debug, null, 2));
        }

    } catch (error) {
        console.error(error);
        resetThumbnailToDefault();
        showMessage("Tidak dapat terhubung ke server.", "error");
    }

}


function resetThumbnailToDefault() {

    const thumbnail = document.getElementById("thumbnail");
    const resultPlatform = document.getElementById("resultPlatform");

    if (!thumbnail) return;

    const platform = resultPlatform ? resultPlatform.textContent : "";

    thumbnail.className = "thumbnail platform-" + platform.toLowerCase();
    thumbnail.innerHTML = `<span>${getPlatformIcon(platform)}</span>`;

}


// =========================
// SHOW RESULT
// =========================

function showResult(platform, url) {

    const resultBox = document.getElementById("resultBox");
    const resultPlatform = document.getElementById("resultPlatform");
    const resultTitle = document.getElementById("resultTitle");
    const resultUrl = document.getElementById("resultUrl");
    const thumbnail = document.getElementById("thumbnail");
    const formatSelect = document.getElementById("formatSelect");

    resultPlatform.textContent = platform;

    const mediaData = {
        TikTok: { title: "TikTok Video", formats: ["mp4", "mp3"] },
        Instagram: { title: "Instagram Media", formats: ["mp4", "mp3"] },
        Facebook: { title: "Facebook Media", formats: ["mp4", "mp3"] },
        Pinterest: { title: "Pinterest Media", formats: ["jpg", "mp4"] },
        YouTube: { title: "YouTube Video", formats: ["mp4", "mp3"] }
    };

    const data = mediaData[platform];

    resultTitle.textContent = data.title;
    resultUrl.textContent = url;

    thumbnail.className = "thumbnail platform-" + platform.toLowerCase();
    thumbnail.innerHTML = `<span>${getPlatformIcon(platform)}</span>`;

    formatSelect.innerHTML = "";

    data.formats.forEach(format => {
        const option = document.createElement("option");
        option.value = format;
        option.textContent = format.toUpperCase();
        formatSelect.appendChild(option);
    });

    hideDownloadLink();

    const qualitySelect = document.getElementById("qualitySelect");

    const refetchOnChange = () => {
        fetchAndShowPreview(url, platform, formatSelect.value, qualitySelect.value);
    };

    formatSelect.onchange = refetchOnChange;
    qualitySelect.onchange = refetchOnChange;

    resultBox.style.display = "block";
    resultBox.classList.remove("show");
    void resultBox.offsetWidth;
    resultBox.classList.add("show");

    resultBox.scrollIntoView({ behavior: "smooth", block: "nearest" });

}


// =========================
// PLATFORM ICON
// =========================

function getPlatformIcon(platform) {

    switch (platform) {
        case "TikTok": return "♪";
        case "Instagram": return "◎";
        case "Facebook": return "f";
        case "Pinterest": return "P";
        case "YouTube": return "▶";
        default: return "↓";
    }

}


// =========================
// RESULT DOWNLOAD BUTTON
// =========================

const resultDownloadBtn = document.getElementById("resultDownloadBtn");

if (resultDownloadBtn) {

    resultDownloadBtn.addEventListener("click", async () => {

        const platform = document.getElementById("resultPlatform").textContent;
        const format = document.getElementById("formatSelect").value;
        const quality = document.getElementById("qualitySelect").value;

        resultDownloadBtn.disabled = true;
        resultDownloadBtn.innerHTML = `Preparing<span>↻</span>`;

        await new Promise(resolve => setTimeout(resolve, 1000));

        await fetchAndShowPreview(urlInput.value.trim(), platform, format, quality);

        resultDownloadBtn.disabled = false;
        resultDownloadBtn.innerHTML = `Download<span>↓</span>`;

    });

}


// =========================
// DOWNLOAD LINK (hasil dari server)
// =========================

function showVideoPreview(videoUrl) {

    const thumbnail = document.getElementById("thumbnail");
    if (!thumbnail) return;

    thumbnail.innerHTML = "";

    const isImage = /\.(jpe?g|png|webp|gif)(\?|$)/i.test(videoUrl);

    if (isImage) {
        const img = document.createElement("img");
        img.src = videoUrl;
        img.style.width = "100%";
        img.style.height = "100%";
        img.style.objectFit = "contain";
        img.style.background = "#050208";
        thumbnail.appendChild(img);
        return;
    }

    const video = document.createElement("video");
    video.src = videoUrl;
    video.muted = false;
    video.playsInline = true;
    video.preload = "metadata";
    video.controls = true;

    thumbnail.appendChild(video);

}


function showDownloadLink(videoUrl, title, format) {

    showVideoPreview(videoUrl);

    let linkBox = document.getElementById("downloadLinkBox");

    if (!linkBox) {
        linkBox = document.createElement("div");
        linkBox.id = "downloadLinkBox";
        linkBox.style.marginTop = "14px";
        linkBox.style.textAlign = "center";
        document.getElementById("resultDownloadBtn").after(linkBox);
    }

    linkBox.innerHTML = "";

    const link = document.createElement("a");
    link.href = videoUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";

    const safeTitle = (title || "video").replace(/[\\/:*?"<>|]/g, "").slice(0, 60).trim() || "video";
    const ext = format === "mp3" ? "mp3" : format === "jpg" ? "jpg" : "mp4";
    const fileName = `${safeTitle}.${ext}`;

    link.download = fileName;

    const isImageFile = ext === "jpg";

    link.textContent = isImageFile
        ? "🔗 Buka Gambar (lalu tekan-tahan untuk simpan)"
        : "⬇ Simpan Video";

    link.style.display = "flex";
    link.style.alignItems = "center";
    link.style.justifyContent = "center";
    link.style.marginTop = "10px";
    link.style.padding = "14px";
    link.style.borderRadius = "9px";
    link.style.background = "#1a9d4d";
    link.style.border = "none";
    link.style.color = "#ffffff";
    link.style.fontWeight = "700";
    link.style.fontSize = "15px";
    link.style.textDecoration = "none";
    link.style.textAlign = "center";

    linkBox.appendChild(link);

    if (ext === "jpg") {
        const hint = document.createElement("div");
        hint.textContent = "Tips: setelah gambar terbuka, tekan & tahan gambarnya untuk memilih \"Simpan gambar\".";
        hint.style.marginTop = "8px";
        hint.style.fontSize = "11px";
        hint.style.color = "#8b98a5";
        hint.style.textAlign = "center";
        linkBox.appendChild(hint);
    }

    if (title) {
        const titleText = document.createElement("div");
        titleText.textContent = title;
        titleText.style.marginTop = "8px";
        titleText.style.fontSize = "12px";
        titleText.style.color = "#666";
        titleText.style.textAlign = "center";
        titleText.style.overflow = "hidden";
        titleText.style.textOverflow = "ellipsis";
        titleText.style.display = "-webkit-box";
        titleText.style.webkitLineClamp = "2";
        titleText.style.webkitBoxOrient = "vertical";
        linkBox.appendChild(titleText);
    }

}


function hideDownloadLink() {
    const linkBox = document.getElementById("downloadLinkBox");
    if (linkBox) linkBox.innerHTML = "";
}


// =========================
// MESSAGE
// =========================

function showMessage(message, type) {

    let messageBox = document.getElementById("messageBox");

    if (!messageBox) {

        messageBox = document.createElement("div");
        messageBox.id = "messageBox";

        messageBox.style.margin = "14px auto 0";
        messageBox.style.maxWidth = "720px";
        messageBox.style.padding = "11px 14px";
        messageBox.style.borderRadius = "9px";
        messageBox.style.fontSize = "13px";
        messageBox.style.textAlign = "center";

        document.querySelector(".download-box").after(messageBox);

    }

    if (type === "error") {
        messageBox.style.background = "#fff1f1";
        messageBox.style.border = "1px solid #ffd2d2";
        messageBox.style.color = "#d33";
    } else {
        messageBox.style.background = "#eef9ff";
        messageBox.style.border = "1px solid #ccecff";
        messageBox.style.color = "#1478d4";
    }

    messageBox.textContent = message;
    messageBox.style.display = "block";

    clearTimeout(messageBox.hideTimer);
    messageBox.hideTimer = setTimeout(() => {
        messageBox.style.display = "none";
    }, 5000);

}


updateInputUI();


// =========================
// FAKE CHAT WA GENERATOR
// =========================

(function setupFakeChatGenerator() {

    const card = document.getElementById("fakeChatCard");
    const section = document.getElementById("fakechat");

    if (!card || !section) return;

    // Reveal section saat kartu diklik
    card.addEventListener("click", (event) => {
        event.preventDefault();
        section.classList.add("reveal");
        section.scrollIntoView({ behavior: "smooth", block: "start" });
    });


    // ELEMENTS

    const contactNameInput = document.getElementById("fcContactName");
    const contactStatusInput = document.getElementById("fcContactStatus");
    const timeInput = document.getElementById("fcTime");
    const batteryInput = document.getElementById("fcBattery");

    const messageTextInput = document.getElementById("fcMessageText");
    const messageSideSelect = document.getElementById("fcMessageSide");
    const messageTimeInput = document.getElementById("fcMessageTime");
    const messageShowMenuCheckbox = document.getElementById("fcMessageShowMenu");

    const addMessageBtn = document.getElementById("fcAddMessageBtn");
    const messageListEl = document.getElementById("fcMessageList");
    const downloadBtn = document.getElementById("fcDownloadBtn");

    const previewName = document.getElementById("fcPreviewName");
    const previewStatus = document.getElementById("fcPreviewStatus");
    const previewAvatar = document.getElementById("fcPreviewAvatar");
    const previewTime = document.getElementById("fcPreviewTime");
    const previewBatteryFill = document.getElementById("fcBatteryFill");
    const previewChat = document.getElementById("fcPreviewChat");
    const previewNode = document.getElementById("fcPreview");

    // Kalau ada elemen wajib yang belum ada di HTML, berhenti dengan aman
    // (dan kasih tahu di console, biar gampang ketauan kalau ada id yang typo)
    const requiredEls = {
        contactNameInput, contactStatusInput, timeInput, batteryInput,
        messageTextInput, messageSideSelect, messageTimeInput,
        addMessageBtn, messageListEl, downloadBtn,
        previewName, previewStatus, previewAvatar, previewTime,
        previewBatteryFill, previewChat, previewNode
    };

    for (const [key, el] of Object.entries(requiredEls)) {
        if (!el) {
            console.error(`[FakeChat] Elemen "${key}" tidak ditemukan di HTML — cek id-nya.`);
            return;
        }
    }

    let messages = [];


    // UPDATE HEADER PREVIEW

    function updateHeaderPreview() {

        const name = contactNameInput.value.trim() || "Kontak";
        const status = contactStatusInput.value.trim() || "online";
        const time = timeInput.value.trim() || "9:41";
        const battery = Math.min(100, Math.max(1, Number(batteryInput.value) || 82));

        previewName.textContent = name;
        previewStatus.textContent = status;
        previewAvatar.textContent = name.charAt(0).toUpperCase();
        previewTime.textContent = time;
        previewBatteryFill.style.width = battery + "%";

    }

    [contactNameInput, contactStatusInput, timeInput, batteryInput].forEach(el => {
        el.addEventListener("input", updateHeaderPreview);
    });


    // RENDER CHAT BUBBLES

    function escapeHtml(str) {
        const div = document.createElement("div");
        div.textContent = str;
        return div.innerHTML;
    }

    function renderChat() {

        previewChat.classList.remove("dimmed");

        if (messages.length === 0) {
            previewChat.innerHTML = `
                <div class="wa-bubble received">
                    <span class="wa-bubble-text">Chat kamu bakal muncul di sini</span>
                    <span class="wa-bubble-time">9:41</span>
                </div>
            `;
            return;
        }

        const hasActiveMenu = messages.some(m => m.showMenu);

        if (hasActiveMenu) {
            previewChat.classList.add("dimmed");
        }

        const contextMenuHtml = `
            <div class="wa-context-menu">
                <div class="wa-context-menu-item">Balas<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 17 4 12 9 7"></polyline><path d="M20 18v-2a4 4 0 0 0-4-4H4"></path></svg></div>
                <div class="wa-context-menu-item">Teruskan<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 17 20 12 15 7"></polyline><path d="M4 18v-2a4 4 0 0 1 4-4h12"></path></svg></div>
                <div class="wa-context-menu-item">Salin<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg></div>
                <div class="wa-context-menu-item">Beri Bintang<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg></div>
                <div class="wa-context-menu-item">Sematkan<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="17" x2="12" y2="22"></line><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a1 1 0 0 0 0-2H8a1 1 0 0 0 0 2h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24z"></path></svg></div>
                <div class="wa-context-menu-item">Laporkan<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg></div>
                <div class="wa-context-menu-item">Hapus<svg viewBox="0 0 24 24" fill="none" stroke="#ff453a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></div>
            </div>
        `;

        const reactionBarHtml = `
            <div class="wa-reaction-bar">
                <span>👍</span><span>❤️</span><span>😂</span><span>😮</span><span>😢</span><span>🙏</span>
                <span class="wa-reaction-plus">+</span>
            </div>
        `;

        previewChat.innerHTML = messages.map(msg => {

            const bubbleHtml = `
                <div class="wa-bubble ${msg.side}${msg.showMenu ? ' menu-active' : ''}">
                    <span class="wa-bubble-text">${escapeHtml(msg.text)}</span>
                    <span class="wa-bubble-time">${escapeHtml(msg.time)}</span>
                </div>
            `;

            if (msg.showMenu) {
                return reactionBarHtml + bubbleHtml + contextMenuHtml;
            }

            return bubbleHtml;

        }).join("");

        previewChat.scrollTop = previewChat.scrollHeight;

    }

    function renderMessageList() {

        if (messages.length === 0) {
            messageListEl.innerHTML = "";
            return;
        }

        messageListEl.innerHTML = messages.map((msg, index) => `
            <div class="fc-message-item">
                <span>${msg.side === "sent" ? "➡" : "⬅"} ${escapeHtml(msg.text)} (${escapeHtml(msg.time)})</span>
                <button data-index="${index}" aria-label="Hapus pesan">×</button>
            </div>
        `).join("");

        messageListEl.querySelectorAll("button").forEach(btn => {
            btn.addEventListener("click", () => {
                const idx = Number(btn.dataset.index);
                messages.splice(idx, 1);
                renderMessageList();
                renderChat();
            });
        });

    }


    // TAMBAH PESAN

    addMessageBtn.addEventListener("click", () => {

        const text = messageTextInput.value.trim();

        if (!text) {
            messageTextInput.focus();
            return;
        }

        const side = messageSideSelect.value;
        const time = messageTimeInput.value.trim() || timeInput.value.trim() || "9:41";

        // FIX: checkbox context menu bersifat opsional — kalau belum ada di HTML,
        // jangan crash, anggap saja false. Ini yang bikin pesan gak nambah sebelumnya:
        // "Cannot read properties of null (reading 'checked')" menghentikan seluruh
        // fungsi ini sebelum sempat sampai ke messages.push().
        const showMenu = messageShowMenuCheckbox ? messageShowMenuCheckbox.checked : false;

        // Cuma boleh 1 pesan yang lagi tampilin menu dalam satu waktu
        if (showMenu) {
            messages.forEach(m => { m.showMenu = false; });
        }

        messages.push({ text, side, time, showMenu });

        messageTextInput.value = "";
        messageTimeInput.value = "";
        if (messageShowMenuCheckbox) messageShowMenuCheckbox.checked = false;
        messageTextInput.focus();

        renderMessageList();
        renderChat();

    });


    // DOWNLOAD SEBAGAI GAMBAR

    downloadBtn.addEventListener("click", async () => {

        if (typeof html2canvas === "undefined") {
            alert("Library screenshot belum termuat, coba refresh halaman.");
            return;
        }

        downloadBtn.disabled = true;
        downloadBtn.textContent = "Memproses...";

        try {

            const canvas = await html2canvas(previewNode, {
                backgroundColor: null,
                scale: 2
            });

            const link = document.createElement("a");
            link.download = "fake-chat-wa.png";
            link.href = canvas.toDataURL("image/png");
            link.click();

        } catch (error) {
            console.error(error);
            alert("Gagal membuat screenshot. Coba lagi.");
        }

        downloadBtn.disabled = false;
        downloadBtn.textContent = "⬇ Download Screenshot";

    });


    // Init awal
    updateHeaderPreview();
    renderChat();

})();
