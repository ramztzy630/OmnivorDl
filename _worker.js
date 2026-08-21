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
  const wrapper = items[0];

  if (!wrapper) {
    return {
      success: false,
      message: "Video tidak ditemukan atau link tidak valid.",
    };
  }

  // PENTING: hasil sebenarnya ada satu level lebih dalam, di wrapper.result
  // (bukan langsung di wrapper). Struktur asli:
  // { status: "success", result: { type, desc, author, statistics, video, music } }
  const result = wrapper.result || wrapper;

  const videoUrl = result.video?.playAddr?.[0] || null;
  const musicUrl = result.music?.playUrl?.[0] || null;

  // Kalau link video tidak ditemukan, kembalikan sebagai gagal (bukan sukses palsu)
  if (!videoUrl) {
    return {
      success: false,
      message: "Video tidak ditemukan. Coba link TikTok lain atau tunggu beberapa saat.",
      debug: { wrapper }, // sementara, buat lihat struktur data asli yang diterima Worker
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
// HANDLER: YOUTUBE (via Apify)
// =========================
async function handleYoutube(mediaUrl, env, format) {
  const actorId = "scraper_one~yt-downloader";
  const apiUrl = `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${env.APIFY_TOKEN}`;

  const isAudio = format === "mp3";

  const body = isAudio
    ? {
        videoUrls: [mediaUrl],
        audioOnly: true,
        audioBitrate: "128kbps",
      }
    : {
        videoUrls: [mediaUrl],
        quality: "720p",
      };

  async function callApify() {
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`Apify error: ${res.status}`);
    }

    const items = await res.json();
    return items[0];
  }

  // Percobaan pertama
  let result = await callApify();

  // Kalau kosong, coba sekali lagi (kadang gangguan sesaat di sisi Apify/YouTube)
  if (!result || !result.downloadUrl) {
    result = await callApify();
  }

  if (!result || !result.downloadUrl) {
    return {
      success: false,
      message: "Video tidak ditemukan setelah 2x percobaan. Coba link YouTube lain atau ulangi beberapa saat lagi.",
      debug: { result },
    };
  }

  return {
    success: true,
    message: "Video berhasil ditemukan.",
    data: {
      platform: "youtube",
      title: result.title || null,
      videoUrl: result.downloadUrl,
    },
  };
}

// =========================
// HANDLER: PINTEREST (via Apify)
// =========================
async function handlePinterest(mediaUrl, env) {
  const actorId = "igview-owner~pinterest-downloader-api";
  const apiUrl = `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${env.APIFY_TOKEN}`;

  // Resolve link pendek (pin.it) jadi link panjang
  let resolvedUrl = mediaUrl;

  if (mediaUrl.includes("pin.it")) {

    // Coba 1: baca header redirect manual (Location)
    const manualRes = await fetch(mediaUrl, { redirect: "manual" });
    const location = manualRes.headers.get("location");

    if (location && location.includes("pinterest.")) {
      resolvedUrl = location;
    } else {
      // Coba 2: pin.it kadang pakai redirect via halaman HTML (bukan header),
      // jadi cari link pinterest.com/pin/... di dalam isi HTML-nya
      const pageRes = await fetch(mediaUrl, { redirect: "follow" });
      const html = await pageRes.text();

      const match = html.match(
        /https:\/\/[a-z.]*pinterest\.[a-z]{2,}\/pin\/[0-9]+\/?/i
      );

      if (match) {
        resolvedUrl = match[0];
      } else if (pageRes.url && pageRes.url.includes("pinterest.")) {
        resolvedUrl = pageRes.url;
      }
    }

  }

  // Bersihkan subdomain negara (id., jp., es., dll) jadi www. biasa
  resolvedUrl = resolvedUrl.replace(
    /^https?:\/\/[a-z]{2}\.pinterest\./i,
    "https://www.pinterest."
  );

  const apifyRes = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      pin_urls: [resolvedUrl],
    }),
  });

  if (!apifyRes.ok) {
    const errBody = await apifyRes.text();
    throw new Error(`Apify error: ${apifyRes.status} | resolvedUrl: ${resolvedUrl} | ${errBody.slice(0, 200)}`);
  }

  const items = await apifyRes.json();
  const wrapper = items[0];

  if (!wrapper) {
    return {
      success: false,
      message: "Media Pinterest tidak ditemukan atau link tidak valid.",
    };
  }

  // Beberapa actor Apify membungkus hasil satu level lebih dalam (result.result)
  const result = wrapper.result || wrapper;

  if (!result.url) {
    return {
      success: false,
      message: "Media Pinterest tidak ditemukan. Coba link lain atau tunggu beberapa saat.",
      debug: { result },
    };
  }

  return {
    success: true,
    message: "Media berhasil ditemukan.",
    data: {
      platform: "pinterest",
      title: result.title || null,
      videoUrl: result.url,
      thumbnail: result.thumbnail || null,
      width: result.width || null,
      height: result.height || null,
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

            case "youtube":
              result = await handleYoutube(mediaUrl, env, format);
              break;

            case "pinterest":
              result = await handlePinterest(mediaUrl, env);
              break;

            /*
              Platform lain nanti ditambah di sini:
              case "instagram": result = await handleInstagram(mediaUrl, env); break;
              case "facebook": result = await handleFacebook(mediaUrl, env); break;
              case "pinterest": result = await handlePinterest(mediaUrl, env); break;
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
