const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 3000;


// =========================
// MIDDLEWARE
// =========================

app.use(cors());

app.use(express.json());


// =========================
// HOME
// =========================

app.get("/", (req, res) => {

    res.json({
        success: true,
        name: "OmnivorDL API",
        status: "online"
    });

});


// =========================
// DOWNLOAD ENDPOINT
// =========================

app.post("/api/download", async (req, res) => {

    try {

        const { url, platform, format, quality } =
            req.body;


        // Validasi

        if (!url) {

            return res.status(400).json({
                success: false,
                message: "URL diperlukan."
            });

        }


        if (!platform) {

            return res.status(400).json({
                success: false,
                message: "Platform diperlukan."
            });

        }


        console.log("Request masuk:");

        console.log({
            url,
            platform,
            format,
            quality
        });


        /*
            NANTI DI SINI KITA HUBUNGKAN
            API PROVIDER YANG SESUAI.

            Contoh:

            TikTok
            Instagram
            Facebook
            Pinterest
            YouTube
        */


        return res.json({

            success: true,

            message:
                "Request berhasil diterima.",

            data: {
                platform,
                format: format || null,
                quality: quality || null,
                url
            }

        });


    } catch (error) {

        console.error(error);

        res.status(500).json({

            success: false,

            message:
                "Terjadi kesalahan pada server."

        });

    }

});


// =========================
// START SERVER
// =========================

app.listen(PORT, () => {

    console.log(
        `OmnivorDL API berjalan di http://localhost:${PORT}`
    );

});
