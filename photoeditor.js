/* ============================================================
   EDIT TEKS FOTO - photoeditor.js
   Dibungkus IIFE. Tidak ada upload ke server — semua proses
   gambar terjadi di browser lewat <canvas>.
   ============================================================ */
(function () {
    "use strict";

    var canvas   = document.getElementById("peCanvas");
    if (!canvas) return; // HTML fitur ini belum ditempel, berhenti diam-diam

    var ctx = canvas.getContext("2d");

    var uploadInput   = document.getElementById("peUploadInput");
    var uploadBtn     = document.getElementById("peUploadBtn");
    var dropMsg       = document.getElementById("peDropMsg");
    var addRectBtn    = document.getElementById("peAddRectBtn");
    var addTextBtn    = document.getElementById("peAddTextBtn");
    var eyedropperBtn = document.getElementById("peEyedropperBtn");
    var deleteBtn     = document.getElementById("peDeleteBtn");
    var resetBtn      = document.getElementById("peResetBtn");
    var downloadBtn   = document.getElementById("peDownloadBtn");

    var propsEmpty  = document.getElementById("pePropsEmpty");
    var rectProps   = document.getElementById("peRectProps");
    var textProps   = document.getElementById("peTextProps");

    var rectColor   = document.getElementById("peRectColor");
    var rectOpacity = document.getElementById("peRectOpacity");
    var rectRotation= document.getElementById("peRectRotation");

    var textContent = document.getElementById("peTextContent");
    var fontFamily  = document.getElementById("peFontFamily");
    var fontSize    = document.getElementById("peFontSize");
    var fontColor   = document.getElementById("peFontColor");
    var fontBold    = document.getElementById("peFontBold");
    var outlineOn   = document.getElementById("peOutlineOn");
    var outlineColor= document.getElementById("peOutlineColor");
    var textRotation= document.getElementById("peTextRotation");

    var toast = document.getElementById("peToast");

    var section = document.getElementById("phototext");
    var toolCard = document.getElementById("photoTextCard");
    if (toolCard && section) {
        toolCard.addEventListener("click", function (e) {
            e.preventDefault();
            section.classList.add("pe-open");
            section.scrollIntoView({ behavior: "smooth", block: "start" });
        });
    }

    // Kalau ada elemen inti yang belum ditempel, berhenti dengan aman
    var core = [uploadInput, uploadBtn, addRectBtn, addTextBtn, eyedropperBtn,
                deleteBtn, resetBtn, downloadBtn];
    if (core.some(function (el) { return !el; })) return;

    // ---------- State ----------
    var baseImage = null;
    var layers = [];
    var nextId = 1;
    var selectedId = null;
    var eyedropperActive = false;

    var drag = null;   // { id, mode:'move'|'resize', startX, startY, orig... }
    var toastTimer = null;

    var MAX_CANVAS_WIDTH = 900; // batas resolusi kerja, cukup untuk hasil rapi

    // ---------- Util ----------
    function showToast(msg) {
        toast.textContent = msg;
        toast.classList.add("pe-show");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () { toast.classList.remove("pe-show"); }, 2000);
    }

    function getLayer(id) {
        for (var i = 0; i < layers.length; i++) if (layers[i].id === id) return layers[i];
        return null;
    }

    function selectedLayer() { return selectedId ? getLayer(selectedId) : null; }

    // Posisi pointer (mouse/touch/pen) dikonversi ke koordinat piksel kanvas asli
    function getCanvasPos(evt) {
        var rect = canvas.getBoundingClientRect();
        var scaleX = canvas.width / rect.width;
        var scaleY = canvas.height / rect.height;
        return {
            x: (evt.clientX - rect.left) * scaleX,
            y: (evt.clientY - rect.top) * scaleY
        };
    }

    function fontString(layer) {
        return (layer.bold ? "bold " : "") + layer.fontSize + "px " + layer.fontFamily;
    }

    // Lebar/tinggi kotak pembatas teks, dipakai untuk hit-test & handle resize
    function textBounds(layer) {
        ctx.save();
        ctx.font = fontString(layer);
        var w = Math.max(20, ctx.measureText(layer.text || " ").width);
        ctx.restore();
        var h = layer.fontSize * 1.3;
        return { w: w, h: h };
    }

    function layerBounds(layer) {
        if (layer.type === "rect") return { w: layer.w, h: layer.h };
        return textBounds(layer);
    }

    // ---------- Gambar ulang kanvas ----------
    function draw() {
        if (!baseImage) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);

        layers.forEach(function (layer) { drawLayer(layer); });

        var sel = selectedLayer();
        if (sel) drawSelection(sel);
    }

    function drawLayer(layer) {
        var b = layerBounds(layer);
        ctx.save();
        ctx.translate(layer.x, layer.y);
        ctx.rotate((layer.rotation || 0) * Math.PI / 180);

        if (layer.type === "rect") {
            ctx.globalAlpha = layer.opacity;
            ctx.fillStyle = layer.color;
            ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
            ctx.globalAlpha = 1;
        } else {
            ctx.font = fontString(layer);
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            if (layer.outline) {
                ctx.lineWidth = Math.max(2, layer.fontSize * 0.12);
                ctx.strokeStyle = layer.outlineColor;
                ctx.strokeText(layer.text, 0, 0);
            }
            ctx.fillStyle = layer.color;
            ctx.fillText(layer.text, 0, 0);
        }

        ctx.restore();
    }

    function drawSelection(layer) {
        var b = layerBounds(layer);
        ctx.save();
        ctx.translate(layer.x, layer.y);
        ctx.rotate((layer.rotation || 0) * Math.PI / 180);

        ctx.strokeStyle = "#00d2ff";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 4]);
        ctx.strokeRect(-b.w / 2, -b.h / 2, b.w, b.h);
        ctx.setLineDash([]);

        // handle resize di sudut kanan-bawah (hanya untuk kotak penutup)
        if (layer.type === "rect") {
            ctx.fillStyle = "#00d2ff";
            ctx.beginPath();
            ctx.arc(b.w / 2, b.h / 2, 6, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    // Ubah titik layar (world) jadi koordinat lokal layer (sebelum rotasi),
    // supaya hit-test tetap benar walau layer diputar.
    function toLocal(layer, x, y) {
        var dx = x - layer.x, dy = y - layer.y;
        var rad = -(layer.rotation || 0) * Math.PI / 180;
        return {
            x: dx * Math.cos(rad) - dy * Math.sin(rad),
            y: dx * Math.sin(rad) + dy * Math.cos(rad)
        };
    }

    function hitResizeHandle(layer, x, y) {
        if (layer.type !== "rect") return false;
        var b = layerBounds(layer);
        var p = toLocal(layer, x, y);
        var hx = b.w / 2, hy = b.h / 2;
        return Math.hypot(p.x - hx, p.y - hy) <= 10;
    }

    function hitLayer(layer, x, y) {
        var b = layerBounds(layer);
        var p = toLocal(layer, x, y);
        return p.x >= -b.w / 2 && p.x <= b.w / 2 && p.y >= -b.h / 2 && p.y <= b.h / 2;
    }

    function findTopLayerAt(x, y) {
        for (var i = layers.length - 1; i >= 0; i--) {
            if (hitLayer(layers[i], x, y)) return layers[i];
        }
        return null;
    }

    // ---------- Panel properti ----------
    function refreshPropsPanel() {
        var layer = selectedLayer();

        propsEmpty.style.display = layer ? "none" : "block";
        rectProps.style.display = layer && layer.type === "rect" ? "block" : "none";
        textProps.style.display = layer && layer.type === "text" ? "block" : "none";
        deleteBtn.disabled = !layer;

        if (!layer) return;

        if (layer.type === "rect") {
            rectColor.value = layer.color;
            rectOpacity.value = layer.opacity;
            rectRotation.value = layer.rotation;
        } else {
            textContent.value = layer.text;
            fontFamily.value = layer.fontFamily;
            fontSize.value = layer.fontSize;
            fontColor.value = layer.color;
            fontBold.checked = layer.bold;
            outlineOn.checked = layer.outline;
            outlineColor.value = layer.outlineColor;
            outlineColor.disabled = !layer.outline;
            textRotation.value = layer.rotation;
        }
    }

    function selectLayer(id) {
        selectedId = id;
        refreshPropsPanel();
        draw();
    }

    // ---------- Muat gambar ----------
    function loadImageFile(file) {
        if (!file || file.type.indexOf("image/") !== 0) {
            showToast("File bukan gambar");
            return;
        }
        var reader = new FileReader();
        reader.onload = function (e) {
            var img = new Image();
            img.onload = function () {
                var scale = Math.min(1, MAX_CANVAS_WIDTH / img.naturalWidth);
                canvas.width = Math.round(img.naturalWidth * scale);
                canvas.height = Math.round(img.naturalHeight * scale);

                baseImage = img;
                layers = [];
                nextId = 1;
                selectedId = null;

                canvas.classList.add("pe-has-image");
                if (dropMsg) dropMsg.style.display = "none";

                refreshPropsPanel();
                draw();
            };
            img.onerror = function () { showToast("Gagal memuat gambar"); };
            img.src = e.target.result;
        };
        reader.onerror = function () { showToast("Gagal membaca file"); };
        reader.readAsDataURL(file);
    }

    uploadBtn.addEventListener("click", function () { uploadInput.click(); });
    uploadInput.addEventListener("change", function () {
        if (uploadInput.files && uploadInput.files[0]) loadImageFile(uploadInput.files[0]);
    });

    // Drag & drop file langsung ke area kanvas
    var canvasCard = canvas.closest(".pe-canvas-card") || canvas.parentElement;
    ["dragover", "dragleave", "drop"].forEach(function (evtName) {
        canvasCard.addEventListener(evtName, function (e) { e.preventDefault(); });
    });
    canvasCard.addEventListener("drop", function (e) {
        if (e.dataTransfer.files && e.dataTransfer.files[0]) loadImageFile(e.dataTransfer.files[0]);
    });

    // ---------- Tambah layer ----------
    addRectBtn.addEventListener("click", function () {
        if (!baseImage) { showToast("Upload gambar dulu"); return; }
        var layer = {
            id: nextId++, type: "rect",
            x: canvas.width / 2, y: canvas.height / 2,
            w: Math.min(160, canvas.width * 0.4),
            h: Math.min(50, canvas.height * 0.15),
            color: "#ffffff", opacity: 1, rotation: 0
        };
        layers.push(layer);
        selectLayer(layer.id);
    });

    addTextBtn.addEventListener("click", function () {
        if (!baseImage) { showToast("Upload gambar dulu"); return; }
        var layer = {
            id: nextId++, type: "text",
            x: canvas.width / 2, y: canvas.height / 2,
            text: "Teks Baru", fontFamily: "Arial", fontSize: 32,
            color: "#000000", bold: false,
            outline: false, outlineColor: "#ffffff",
            rotation: 0
        };
        layers.push(layer);
        selectLayer(layer.id);
    });

    deleteBtn.addEventListener("click", function () {
        if (!selectedId) return;
        layers = layers.filter(function (l) { return l.id !== selectedId; });
        selectLayer(null);
    });

    resetBtn.addEventListener("click", function () {
        baseImage = null;
        layers = [];
        selectedId = null;
        eyedropperActive = false;
        eyedropperBtn.classList.remove("pe-active");
        canvas.classList.remove("pe-has-image");
        canvas.style.cursor = "default";
        if (dropMsg) dropMsg.style.display = "block";
        uploadInput.value = "";
        refreshPropsPanel();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    });

    // ---------- Eyedropper (ambil warna dari foto) ----------
    eyedropperBtn.addEventListener("click", function () {
        if (!baseImage) { showToast("Upload gambar dulu"); return; }
        eyedropperActive = !eyedropperActive;
        eyedropperBtn.classList.toggle("pe-active", eyedropperActive);
        canvas.style.cursor = eyedropperActive ? "crosshair" : "default";
        if (eyedropperActive) showToast("Klik bagian foto untuk ambil warnanya");
    });

    function pickColorAt(x, y) {
        var px = ctx.getImageData(Math.round(x), Math.round(y), 1, 1).data;
        var hex = "#" + [px[0], px[1], px[2]]
            .map(function (v) { return v.toString(16).padStart(2, "0"); })
            .join("");

        var layer = selectedLayer();
        if (layer && layer.type === "rect") {
            layer.color = hex;
            rectColor.value = hex;
        } else if (layer && layer.type === "text") {
            layer.color = hex;
            fontColor.value = hex;
        } else {
            showToast("Pilih kotak atau teks dulu sebelum ambil warna");
        }
        eyedropperActive = false;
        eyedropperBtn.classList.remove("pe-active");
        canvas.style.cursor = "default";
        draw();
    }

    // ---------- Interaksi kanvas (mouse + sentuh, lewat Pointer Events) ----------
    canvas.addEventListener("pointerdown", function (e) {
        if (!baseImage) return;
        var pos = getCanvasPos(e);

        if (eyedropperActive) { pickColorAt(pos.x, pos.y); return; }

        var sel = selectedLayer();
        if (sel && hitResizeHandle(sel, pos.x, pos.y)) {
            drag = { id: sel.id, mode: "resize", startX: pos.x, startY: pos.y, origW: sel.w, origH: sel.h };
            canvas.setPointerCapture(e.pointerId);
            return;
        }

        var hit = findTopLayerAt(pos.x, pos.y);
        if (hit) {
            selectLayer(hit.id);
            drag = { id: hit.id, mode: "move", startX: pos.x, startY: pos.y, origX: hit.x, origY: hit.y };
            canvas.setPointerCapture(e.pointerId);
        } else {
            selectLayer(null);
        }
    });

    canvas.addEventListener("pointermove", function (e) {
        if (!drag) return;
        var pos = getCanvasPos(e);
        var layer = getLayer(drag.id);
        if (!layer) return;

        if (drag.mode === "move") {
            layer.x = drag.origX + (pos.x - drag.startX);
            layer.y = drag.origY + (pos.y - drag.startY);
        } else if (drag.mode === "resize") {
            layer.w = Math.max(16, drag.origW + (pos.x - drag.startX) * 2);
            layer.h = Math.max(12, drag.origH + (pos.y - drag.startY) * 2);
        }
        draw();
    });

    function endDrag() { drag = null; }
    canvas.addEventListener("pointerup", endDrag);
    canvas.addEventListener("pointercancel", endDrag);

    // ---------- Panel properti -> update layer ----------
    rectColor.addEventListener("input", function () {
        var l = selectedLayer(); if (!l) return;
        l.color = rectColor.value; draw();
    });
    rectOpacity.addEventListener("input", function () {
        var l = selectedLayer(); if (!l) return;
        l.opacity = Number(rectOpacity.value); draw();
    });
    rectRotation.addEventListener("input", function () {
        var l = selectedLayer(); if (!l) return;
        l.rotation = Number(rectRotation.value); draw();
    });

    textContent.addEventListener("input", function () {
        var l = selectedLayer(); if (!l) return;
        l.text = textContent.value || " "; draw();
    });
    fontFamily.addEventListener("change", function () {
        var l = selectedLayer(); if (!l) return;
        l.fontFamily = fontFamily.value; draw();
    });
    fontSize.addEventListener("input", function () {
        var l = selectedLayer(); if (!l) return;
        l.fontSize = Number(fontSize.value); draw();
    });
    fontColor.addEventListener("input", function () {
        var l = selectedLayer(); if (!l) return;
        l.color = fontColor.value; draw();
    });
    fontBold.addEventListener("change", function () {
        var l = selectedLayer(); if (!l) return;
        l.bold = fontBold.checked; draw();
    });
    outlineOn.addEventListener("change", function () {
        var l = selectedLayer(); if (!l) return;
        l.outline = outlineOn.checked;
        outlineColor.disabled = !l.outline;
        draw();
    });
    outlineColor.addEventListener("input", function () {
        var l = selectedLayer(); if (!l) return;
        l.outlineColor = outlineColor.value; draw();
    });
    textRotation.addEventListener("input", function () {
        var l = selectedLayer(); if (!l) return;
        l.rotation = Number(textRotation.value); draw();
    });

    // ---------- Download hasil ----------
    downloadBtn.addEventListener("click", function () {
        if (!baseImage) { showToast("Upload gambar dulu"); return; }

        var wasSelected = selectedId;
        selectedId = null;   // supaya garis seleksi tidak ikut ke gambar hasil
        draw();

        var link = document.createElement("a");
        link.download = "edit-teks-foto.png";
        link.href = canvas.toDataURL("image/png");
        link.click();

        selectedId = wasSelected;
        draw();
        showToast("Gambar berhasil diunduh");
    });

})();
