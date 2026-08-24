// =========================
// FAKE CHAT WA GENERATOR
// =========================

(function setupFakeChatGenerator() {

    const card =
        document.getElementById("fakeChatCard");

    const section =
        document.getElementById("fakechat");

    if (!card || !section) return;

    // Reveal section saat kartu diklik
    card.addEventListener("click", (event) => {

        event.preventDefault();

        section.classList.add("reveal");

        section.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    });


    // =========================
    // ELEMENTS
    // =========================

    const contactNameInput = document.getElementById("fcContactName");
    const contactStatusInput = document.getElementById("fcContactStatus");
    const timeInput = document.getElementById("fcTime");
    const batteryInput = document.getElementById("fcBattery");

    const messageTextInput = document.getElementById("fcMessageText");
    const messageSideSelect = document.getElementById("fcMessageSide");
    const messageTimeInput = document.getElementById("fcMessageTime");

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

    if (!contactNameInput) return;

    let messages = [];


    // =========================
    // UPDATE HEADER PREVIEW
    // =========================

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


    // =========================
    // RENDER CHAT BUBBLES
    // =========================

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
                <div class="wa-context-menu-item">
                    Balas
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 17 4 12 9 7"></polyline><path d="M20 18v-2a4 4 0 0 0-4-4H4"></path></svg>
                </div>
                <div class="wa-context-menu-item">
                    Teruskan
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 17 20 12 15 7"></polyline><path d="M4 18v-2a4 4 0 0 1 4-4h12"></path></svg>
                </div>
                <div class="wa-context-menu-item">
                    Salin
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                </div>
                <div class="wa-context-menu-item">
                    Beri Bintang
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                </div>
                <div class="wa-context-menu-item">
                    Sematkan
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="17" x2="12" y2="22"></line><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a1 1 0 0 0 0-2H8a1 1 0 0 0 0 2h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24z"></path></svg>
                </div>
                <div class="wa-context-menu-item">
                    Laporkan
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                </div>
                <div class="wa-context-menu-item">
                    Hapus
                    <svg viewBox="0 0 24 24" fill="none" stroke="#ff453a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </div>
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


    // =========================
    // TAMBAH PESAN
    // =========================

    const messageShowMenuCheckbox = document.getElementById("fcMessageShowMenu");

    addMessageBtn.addEventListener("click", () => {

        const text = messageTextInput.value.trim();

        if (!text) {
            messageTextInput.focus();
            return;
        }

        const side = messageSideSelect.value;
        const time = messageTimeInput.value.trim() || timeInput.value.trim() || "9:41";
        const showMenu = messageShowMenuCheckbox.checked;

        // Cuma boleh 1 pesan yang lagi tampilin menu dalam satu waktu
        if (showMenu) {
            messages.forEach(m => { m.showMenu = false; });
        }

        messages.push({ text, side, time, showMenu });

        messageTextInput.value = "";
        messageTimeInput.value = "";
        messageShowMenuCheckbox.checked = false;
        messageTextInput.focus();

        renderMessageList();
        renderChat();

    });


    // =========================
    // DOWNLOAD SEBAGAI GAMBAR
    // =========================

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
