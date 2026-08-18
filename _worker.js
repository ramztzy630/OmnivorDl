// _worker.js
// Taruh file ini di ROOT repo (sejajar dengan index.html, script.js, style.css)

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// =========================
// HANDLER: TIKTOK (via Apify)
// =========================
async function handleTikTok(mediaUrl, env) {
  const actorId = "wilcode~fast-tiktok-downloader-without-watermark";
  const apiUrl = `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${env.APIFY_TOKEN}`;

  const apifyRes = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: mediaUrl,
      apiVersion: "v1",
    }),
  });

  if (!apifyRes.ok) {
    throw new Error(`Apify error: ${apifyRes.status}`);
  }

  const items = await apifyRes.json();
  const result = items[0];

  if (!result) {
    return { success: false, message: "Video tidak ditemukan atau link tidak valid." };
  }

  // Struktur asli actor wilcode/fast-tiktok-downloader-without-watermark:
  // { type, desc, author: {avatar, nickname}, statistics: {...},
  //   video: { playAddr: [url] }, music: { playUrl: [url] } }
  const videoUrl = result.video?.playAddr?.[0] || null;
  const musicUrl = result.music?.playUrl?.[0] || null;

  // Kalau link video tidak ditemukan, kembalikan sebagai gagal (bukan sukses palsu)
  if (!videoUrl) {
    return {
      success: false,
      message: "Video tidak ditemukan. Coba link TikTok lain atau tunggu beberapa saat.",
    };
  }

  return {
    success: true,
    message: "Video berhasil ditemukan.",
    data: {
      platform: "tiktok",
      title: result.desc || null,
      videoUrl,
      musicUrl,
      author: result.author?.nickname || null,
      authorAvatar: result.author?.avatar || null,
      likeCount: result.statistics?.likeCount || null,
      commentCount: result.statistics?.commentCount || null,
      shareCount: result.statistics?.shareCount || null,
    },
  };
}

// =========================
// ROUTER UTAMA
// =========================
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/api/download") {

      if (request.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
      }

      if (request.method === "GET") {
        return Response.json(
          { success: true, name: "OmnivorDL API", status: "online" },
          { headers: corsHeaders }
        );
      }

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

          let result;

          switch (platform.toLowerCase()) {
            case "tiktok":
              result = await handleTikTok(mediaUrl, env);
              break;

            /*
              Platform lain nanti ditambah di sini:
              case "instagram": result = await handleInstagram(mediaUrl, env); break;
              case "facebook": result = await handleFacebook(mediaUrl, env); break;
              case "pinterest": result = await handlePinterest(mediaUrl, env); break;
              case "youtube": result = await handleYoutube(mediaUrl, env); break;
            */

            default:
              return Response.json(
                { success: false, message: `Platform "${platform}" belum didukung.` },
                { status: 400, headers: corsHeaders }
              );
          }

          return Response.json(result, { headers: corsHeaders });

        } catch (error) {
          console.error(error);
          return Response.json(
            { success: false, message: "Terjadi kesalahan pada server.", error: error.message },
            { status: 500, headers: corsHeaders }
          );
        }
      }
    }

    // Selain /api/download → file statis
    return env.ASSETS.fetch(request);
  },
};
