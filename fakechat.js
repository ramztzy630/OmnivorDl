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

        if (messages.length === 0) {

            previewChat.innerHTML = `
                <div class="wa-bubble received">
                    <span class="wa-bubble-text">Chat kamu bakal muncul di sini</span>
                    <span class="wa-bubble-time">9:41</span>
                </div>
            `;

            return;

        }

        previewChat.innerHTML = messages.map(msg => `
            <div class="wa-bubble ${msg.side}">
                <span class="wa-bubble-text">${escapeHtml(msg.text)}</span>
                <span class="wa-bubble-time">${escapeHtml(msg.time)}</span>
            </div>
        `).join("");

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

    addMessageBtn.addEventListener("click", () => {

        const text = messageTextInput.value.trim();

        if (!text) {
            messageTextInput.focus();
            return;
        }

        const side = messageSideSelect.value;
        const time = messageTimeInput.value.trim() || timeInput.value.trim() || "9:41";

        messages.push({ text, side, time });

        messageTextInput.value = "";
        messageTimeInput.value = "";
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
