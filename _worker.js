// _worker.js
// Taruh file ini di ROOT repo (sejajar dengan index.html, script.js, style.css)
// Ini jadi "pintu masuk" utama Worker: dia yang atur mana request ke API,
// mana request yang harus ditampilkan sebagai file statis (html/css/js).

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // =========================
    // ROUTE: /api/download
    // =========================
    if (url.pathname === "/api/download") {

      // Preflight CORS
      if (request.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
      }

      // Cek status API (GET)
      if (request.method === "GET") {
        return Response.json(
          { success: true, name: "OmnivorDL API", status: "online" },
          { headers: corsHeaders }
        );
      }

      // Proses download (POST)
      if (request.method === "POST") {
        try {
          const { url: mediaUrl, platform, format, quality } = await request.json();

          if (!mediaUrl) {
            return Response.json(
              { success: false, message: "URL diperlukan." },
              { status: 400, headers: corsHeaders }
            );
          }

          if (!platform) {
            return Response.json(
              { success: false, message: "Platform diperlukan." },
              { status: 400, headers: corsHeaders }
            );
          }

          console.log("Request masuk:", { mediaUrl, platform, format, quality });

          /*
            =========================
            DI SINI NANTI KITA HUBUNGKAN
            KE API PROVIDER PER PLATFORM
            (TikTok, Instagram, Facebook, Pinterest, YouTube)
          */

          return Response.json(
            {
              success: true,
              message: "Request berhasil diterima.",
              data: {
                platform,
                format: format || null,
                quality: quality || null,
                url: mediaUrl,
              },
            },
            { headers: corsHeaders }
          );
        } catch (error) {
          console.error(error);
          return Response.json(
            { success: false, message: "Terjadi kesalahan pada server." },
            { status: 500, headers: corsHeaders }
          );
        }
      }
    }

    // =========================
    // SELAIN /api/download → tampilkan file statis
    // (index.html, script.js, style.css, dll)
    // =========================
    return env.ASSETS.fetch(request);
  },
};
