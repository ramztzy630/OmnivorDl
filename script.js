// =========================
// DETEKSI DEVICE & BROWSER (buat status card portal)
// =========================

(function detectDeviceAndBrowser() {

    const deviceEl =
        document.getElementById("deviceValue");

    const browserEl =
        document.getElementById("browserValue");

    if (!deviceEl || !browserEl) return;

    const ua = navigator.userAgent;

    // Device / OS
    let device = "Unknown";

    if (/android/i.test(ua)) device = "Android";
    else if (/iphone|ipad|ipod/i.test(ua)) device = "iOS";
    else if (/windows/i.test(ua)) device = "Windows";
    else if (/macintosh|mac os/i.test(ua)) device = "macOS";
    else if (/linux/i.test(ua)) device = "Linux";

    deviceEl.textContent = device;

    // Browser
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

    const card =
        document.getElementById("mediaDownloaderCard");

    const mainContent =
        document.querySelector("main");

    const heroSection =
        document.getElementById("home");

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

    const link =
        document.getElementById("aboutDevLink");

    const modal =
        document.getElementById("aboutDevModal");

    const closeBtn =
        document.getElementById("closeAboutDev");

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

        if (
            hostname.includes("tiktok.com") ||
            hostname.includes("vm.tiktok.com") ||
            hostname.includes("vt.tiktok.com")
        ) {
            return "TikTok";
        }

        if (
            hostname.includes("instagram.com") ||
            hostname.includes("instagr.am")
        ) {
            return "Instagram";
        }

        if (
            hostname.includes("facebook.com") ||
            hostname.includes("fb.watch")
        ) {
            return "Facebook";
        }

        if (
            hostname.includes("pinterest.com") ||
            hostname.includes("pin.it")
        ) {
            return "Pinterest";
        }

        if (
            hostname.includes("youtube.com") ||
            hostname.includes("youtu.be")
        ) {
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

urlInput.addEventListener(
    "input",
    updateInputUI
);


// =========================
// CLEAR BUTTON
// =========================

clearBtn.addEventListener(
    "click",
    () => {

        urlInput.value = "";

        updateInputUI();

        urlInput.focus();

    }
);


// =========================
// DOWNLOAD BUTTON
// =========================

downloadBtn.addEventListener(
    "click",
    processDownload
);


// =========================
// ENTER KEY
// =========================

urlInput.addEventListener(
    "keydown",
    (event) => {

        if (event.key === "Enter") {

            processDownload();

        }

    }
);


// =========================
// MAIN PROCESS
// =========================

async function processDownload() {

    const url = urlInput.value.trim();


    // Empty input

    if (!url) {

        showMessage(
            "Masukkan link terlebih dahulu.",
            "error"
        );

        urlInput.focus();

        return;

    }


    // Detect platform

    const platform =
        detectPlatform(url);


    // Invalid platform

    if (!platform) {

        showMessage(
            "Link tidak dikenali. Gunakan link TikTok, Instagram, Facebook, Pinterest, atau YouTube.",
            "error"
        );

        return;

    }


    // =========================
    // LOADING
    // =========================

    downloadBtn.classList.add(
        "loading"
    );

    downloadBtn.innerHTML = `
        Processing
        <span>↻</span>
    `;


    // Simulasi proses API

    await new Promise(
        resolve => setTimeout(
            resolve,
            1000
        )
    );


    // =========================
    // SHOW RESULT
    // =========================

    showResult(
        platform,
        url
    );


    showMessage(
        `Link ${platform} berhasil dikenali.`,
        "success"
    );


    // =========================
    // RESET BUTTON
    // =========================

    downloadBtn.classList.remove(
        "loading"
    );

    downloadBtn.innerHTML = `
        Download
        <span>↓</span>
    `;


    // =========================
    // LANGSUNG AMBIL PREVIEW VIDEO
    // (pakai format/quality default, tanpa tunggu klik tombol kedua)
    // =========================

    const defaultFormat =
        document.getElementById("formatSelect").value;

    const defaultQuality =
        document.getElementById("qualitySelect").value;

    fetchAndShowPreview(
        url,
        platform,
        defaultFormat,
        defaultQuality
    );

}


// =========================
// FETCH & SHOW PREVIEW (dipanggil otomatis setelah link dikenali)
// =========================

async function fetchAndShowPreview(url, platform, format, quality) {

    // Tampilkan loading di thumbnail selagi proses ambil video
    const thumbnail =
        document.getElementById("thumbnail");

    if (thumbnail) {

        thumbnail.innerHTML = `
            <div style="display:flex;flex-direction:column;align-items:center;gap:10px;color:#8b98a5;">
                <span style="font-size:24px;display:inline-block;animation:spin 0.8s linear infinite;">↻</span>
                <span style="font-size:12px;">Memuat pratinjau video...</span>
            </div>
        `;

    }

    try {

        const response = await fetch(
            "/api/download",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    url: url,
                    platform: platform,
                    format: format,
                    quality: quality
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {

            resetThumbnailToDefault();

            showMessage(
                data.message ||
                "Request gagal.",
                "error"
            );

            if (data.error) {
                alert(
                    "ERROR DETAIL:\n\n" +
                    data.error
                );
            }

            return;

        }

        if (
            data.success &&
            data.data &&
            data.data.videoUrl
        ) {

            showDownloadLink(
                data.data.videoUrl,
                data.data.title,
                format
            );

        } else {

            resetThumbnailToDefault();

            showMessage(
                data.message ||
                "Video tidak ditemukan atau link tidak valid.",
                "error"
            );

            if (data.debug) {
                alert(
                    "DEBUG INFO:\n\n" +
                    JSON.stringify(data.debug, null, 2)
                );
            }

        }

    } catch (error) {

        console.error(error);

        resetThumbnailToDefault();

        showMessage(
            "Tidak dapat terhubung ke server.",
            "error"
        );

    }

}


function resetThumbnailToDefault() {

    const thumbnail =
        document.getElementById("thumbnail");

    const resultPlatform =
        document.getElementById("resultPlatform");

    if (!thumbnail) return;

    const platform =
        resultPlatform ? resultPlatform.textContent : "";

    thumbnail.className =
        "thumbnail platform-" + platform.toLowerCase();

    thumbnail.innerHTML =
        `<span>${getPlatformIcon(platform)}</span>`;

}


// =========================
// SHOW RESULT
// =========================

function showResult(platform, url) {

    const resultBox =
        document.getElementById("resultBox");

    const resultPlatform =
        document.getElementById("resultPlatform");

    const resultTitle =
        document.getElementById("resultTitle");

    const resultUrl =
        document.getElementById("resultUrl");

    const thumbnail =
        document.getElementById("thumbnail");

    const formatSelect =
        document.getElementById("formatSelect");


    // Platform
    resultPlatform.textContent = platform;


    // Contoh metadata sementara
    const mediaData = {
        TikTok: {
            title: "TikTok Video",
            formats: ["mp4", "mp3"]
        },

        Instagram: {
            title: "Instagram Media",
            formats: ["mp4", "mp3"]
        },

        Facebook: {
            title: "Facebook Media",
            formats: ["mp4", "mp3"]
        },

        Pinterest: {
            title: "Pinterest Media",
            formats: ["jpg", "mp4"]
        },

        YouTube: {
            title: "YouTube Video",
            formats: ["mp4", "mp3"]
        }
    };


    const data = mediaData[platform];


    // Title
    resultTitle.textContent =
        data.title;


    // URL
    resultUrl.textContent =
        url;


    // Thumbnail
    thumbnail.className =
        "thumbnail platform-" +
        platform.toLowerCase();

    thumbnail.innerHTML =
        `<span>${getPlatformIcon(platform)}</span>`;


    // Format
    formatSelect.innerHTML = "";

    data.formats.forEach(format => {

        const option =
            document.createElement("option");

        option.value = format;

        option.textContent =
            format.toUpperCase();

        formatSelect.appendChild(option);

    });


    // Sembunyikan link download lama (kalau ada dari request sebelumnya)
    hideDownloadLink();


    // =========================
    // AUTO RE-FETCH SAAT FORMAT/QUALITY DIGANTI
    // =========================

    const qualitySelect =
        document.getElementById("qualitySelect");

    const refetchOnChange = () => {

        fetchAndShowPreview(
            url,
            platform,
            formatSelect.value,
            qualitySelect.value
        );

    };

    formatSelect.onchange = refetchOnChange;
    qualitySelect.onchange = refetchOnChange;


    // Show result
    resultBox.style.display =
        "block";

    resultBox.classList.remove("show");

    void resultBox.offsetWidth;

    resultBox.classList.add("show");


    resultBox.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
    });
}


// =========================
// PLATFORM ICON
// =========================

function getPlatformIcon(
    platform
) {

    switch (platform) {

        case "TikTok":
            return "♪";

        case "Instagram":
            return "◎";

        case "Facebook":
            return "f";

        case "Pinterest":
            return "P";

        case "YouTube":
            return "▶";

        default:
            return "↓";

    }

}

// =========================
// RESULT DOWNLOAD BUTTON
// =========================

const resultDownloadBtn =
    document.getElementById(
        "resultDownloadBtn"
    );


resultDownloadBtn.addEventListener(
    "click",
    async () => {

        const platform =
            document.getElementById(
                "resultPlatform"
            ).textContent;

        const format =
            document.getElementById(
                "formatSelect"
            ).value;

        const quality =
            document.getElementById(
                "qualitySelect"
            ).value;


        // Loading

        resultDownloadBtn.disabled =
            true;

        resultDownloadBtn.innerHTML = `
            Preparing
            <span>↻</span>
        `;


        // Simulasi proses

        await new Promise(
            resolve => setTimeout(
                resolve,
                1000
            )
        );


await fetchAndShowPreview(
    urlInput.value.trim(),
    platform,
    format,
    quality
);


        // Reset button

        resultDownloadBtn.disabled =
            false;

        resultDownloadBtn.innerHTML = `
            Download
            <span>↓</span>
        `;

    }
);


// =========================
// DOWNLOAD LINK (hasil dari server)
// =========================

function showVideoPreview(videoUrl) {

    const thumbnail =
        document.getElementById("thumbnail");

    if (!thumbnail) return;

    thumbnail.innerHTML = "";

    // Deteksi apakah ini gambar (Pinterest kadang ngasih JPG, bukan video)
    const isImage =
        /\.(jpe?g|png|webp|gif)(\?|$)/i.test(videoUrl);

    if (isImage) {

        const img =
            document.createElement("img");

        img.src = videoUrl;
        img.style.width = "100%";
        img.style.height = "100%";
        img.style.objectFit = "contain";
        img.style.background = "#050208";

        thumbnail.appendChild(img);

        return;

    }

    const video =
        document.createElement("video");

    video.src = videoUrl;
    video.muted = false;
    video.playsInline = true;
    video.preload = "metadata";
    video.controls = true;

    thumbnail.appendChild(video);

}


function showDownloadLink(videoUrl, title, format) {

    showVideoPreview(videoUrl);

    let linkBox =
        document.getElementById("downloadLinkBox");

    if (!linkBox) {

        linkBox =
            document.createElement("div");

        linkBox.id = "downloadLinkBox";

        linkBox.style.marginTop = "14px";
        linkBox.style.textAlign = "center";

        document
            .getElementById("resultDownloadBtn")
            .after(linkBox);

    }

    linkBox.innerHTML = "";

    const link =
        document.createElement("a");

    link.href = videoUrl;

    link.target = "_blank";
    link.rel = "noopener noreferrer";

    // Paksa nama & ekstensi file sesuai format yang dipilih user
    // (beberapa provider nyimpen file audio-only dengan ekstensi .mp4 di server)
    const safeTitle =
        (title || "video")
            .replace(/[\\/:*?"<>|]/g, "")
            .slice(0, 60)
            .trim() || "video";

    const ext =
        format === "mp3" ? "mp3" :
        format === "jpg" ? "jpg" :
        "mp4";

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

        const hint =
            document.createElement("div");

        hint.textContent =
            "Tips: setelah gambar terbuka, tekan & tahan gambarnya untuk memilih \"Simpan gambar\".";

        hint.style.marginTop = "8px";
        hint.style.fontSize = "11px";
        hint.style.color = "#8b98a5";
        hint.style.textAlign = "center";

        linkBox.appendChild(hint);

    }


    // Judul video (kalau ada), ditampilkan terpisah, bukan jadi teks link
    if (title) {

        const titleText =
            document.createElement("div");

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

    const linkBox =
        document.getElementById("downloadLinkBox");

    if (linkBox) {

        linkBox.innerHTML = "";

    }

}


// =========================
// MESSAGE
// =========================

function showMessage(
    message,
    type
) {

    let messageBox =
        document.getElementById(
            "messageBox"
        );


    // Create message box

    if (!messageBox) {

        messageBox =
            document.createElement(
                "div"
            );

        messageBox.id =
            "messageBox";


        messageBox.style.margin =
            "14px auto 0";

        messageBox.style.maxWidth =
            "720px";

        messageBox.style.padding =
            "11px 14px";

        messageBox.style.borderRadius =
            "9px";

        messageBox.style.fontSize =
            "13px";

        messageBox.style.textAlign =
            "center";


        document
            .querySelector(
                ".download-box"
            )
            .after(
                messageBox
            );

    }


    // =========================
    // ERROR
    // =========================

    if (type === "error") {

        messageBox.style.background =
            "#fff1f1";

        messageBox.style.border =
            "1px solid #ffd2d2";

        messageBox.style.color =
            "#d33";

    }


    // =========================
    // SUCCESS
    // =========================

    else {

        messageBox.style.background =
            "#eef9ff";

        messageBox.style.border =
            "1px solid #ccecff";

        messageBox.style.color =
            "#1478d4";

    }


    messageBox.textContent =
        message;


    messageBox.style.display =
        "block";


    clearTimeout(
        messageBox.hideTimer
    );


    messageBox.hideTimer =
        setTimeout(
            () => {

                messageBox.style.display =
                    "none";

            },
            5000
        );

}


// =========================
// INITIAL STATE
// =========================

updateInputUI();
