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
            throw new Error(data.message || "Request gagal.");
        }

        if (
            data.success &&
            data.data &&
            data.data.videoUrl
        ) {

            showDownloadLink(
                data.data.videoUrl,
                data.data.title
            );

        } else {

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

        showMessage(
            "Tidak dapat terhubung ke server.",
            "error"
        );

    }

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

    const video =
        document.createElement("video");

    video.src = videoUrl;
    video.muted = false;
    video.playsInline = true;
    video.preload = "metadata";
    video.controls = true;

    thumbnail.appendChild(video);

}


function showDownloadLink(videoUrl, title) {

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
    link.textContent = "⬇ Simpan Video";

    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.download = "";

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
        
