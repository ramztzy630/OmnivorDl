// functions/api/download.js
// Cloudflare Pages Function — pengganti server.js (Express)
// Endpoint ini otomatis aktif di: https://omnivordl.pages.dev/api/download
// (atau domain custom kamu, tergantung setting project)

// =========================
// CORS HEADERS
// =========================
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// Handle preflight request (OPTIONS) — wajib buat CORS
export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}

// =========================
// DOWNLOAD ENDPOINT (POST)
// =========================
export async function onRequestPost(context) {
  try {
    const { request } = context;
    const body = await request.json();
    const { url, platform, format, quality } = body;

    // Validasi
    if (!url) {
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

    console.log("Request masuk:", { url, platform, format, quality });

    /*
      =========================
      DI SINI NANTI KITA HUBUNGKAN
      KE API PROVIDER YANG SESUAI
      PER PLATFORM.

      Contoh platform yang mau didukung:
      - TikTok
      - Instagram
      - Facebook
      - Pinterest
      - YouTube

      Pola umumnya nanti kira-kira begini:

      let result;
      switch (platform) {
        case "tiktok":
          result = await handleTikTok(url, format, quality, context.env);
          break;
        case "instagram":
          result = await handleInstagram(url, format, quality, context.env);
          break;
        default:
          return Response.json(
            { success: false, message: "Platform belum didukung." },
            { status: 400, headers: corsHeaders }
          );
      }
    */

    return Response.json(
      {
        success: true,
        message: "Request berhasil diterima.",
        data: {
          platform,
          format: format || null,
          quality: quality || null,
          url,
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

// =========================
// HOME / STATUS CHECK (GET)
// =========================
export async function onRequestGet() {
  return Response.json(
    {
      success: true,
      name: "OmnivorDL API",
      status: "online",
    },
    { headers: corsHeaders }
  );
}
