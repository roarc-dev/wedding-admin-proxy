export default {
  async fetch(req, env) {
    // --- CORS 헤더 (전역 에러 핸들링을 위해 상단에 정의) ---
    const ALLOWED_ORIGINS = [
      "https://mcard.roarc.kr",
      "https://wedding-admin-proxy.vercel.app",
    ];
    // Framer 프리뷰 도메인 패턴: *.framer.app, *.framercanvas.com
    const FRAMER_PATTERNS = [
      /^https:\/\/.*\.framer\.app$/,
      /^https:\/\/.*\.framercanvas\.com$/,
      /^https:\/\/framer\.com$/,
    ];

    const requestOrigin = req.headers.get("Origin") || "";
    const isAllowedOrigin =
      ALLOWED_ORIGINS.includes(requestOrigin) ||
      FRAMER_PATTERNS.some((pattern) => pattern.test(requestOrigin));

    // 허용된 Origin이면 해당 Origin 반환, 아니면 기본값 사용
    const allowOrigin = isAllowedOrigin ? requestOrigin : ALLOWED_ORIGINS[0];

    const corsHeaders = {
      "Access-Control-Allow-Origin": allowOrigin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Credentials": "true",
    };

    const json = (obj, status = 200) =>
      new Response(JSON.stringify(obj), {
        status,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });

    // ✅ 전역 try-catch: 예상치 못한 에러에서도 CORS 헤더 포함
    try {
      const url = new URL(req.url);

      // /upload/, /upload/index.html → /upload 로 정규화
      const rawPath = url.pathname;
      let path = rawPath.replace(/\/index\.html$/, "");
      path = path.replace(/\/+$/, "") || "/";

      console.log("Request", req.method, rawPath, "→", path);

      if (req.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: corsHeaders });
      }

      // =======================
      //   업로드 엔드포인트
      // =======================
      if (req.method === "POST" && path === "/upload") {
        return await handleUpload(req, env, json);
      }

      // =======================
      //   (옵션) 삭제 엔드포인트
      // =======================
      if (req.method === "POST" && path === "/delete-gallery") {
        return await handleDeleteGallery(req, env, json);
      }

      // 기타 경로
      return new Response("Not found", { status: 404, headers: corsHeaders });
    } catch (globalError) {
      // ✅ Worker 전역 에러 시에도 CORS 헤더 포함하여 반환
      console.error("[Worker] 전역 에러:", globalError);
      return json(
        {
          ok: false,
          error: `Server error: ${String(globalError)}`,
          hint: "파일 크기가 크거나 처리 시간이 초과되었을 수 있습니다. 더 작은 이미지로 시도해주세요.",
        },
        500
      );
    }
  },
};

// =======================
//   업로드 핸들러
// =======================
async function handleUpload(req, env, json) {
  // 업로드 최대 크기: 10MB (안정성을 위해 20MB → 10MB로 낮춤)
  // Cloudflare Images API는 큰 이미지에서 CPU time 초과 가능
  const MAX_UPLOAD_SIZE = 10 * 1024 * 1024;

  try {
    console.log("[Upload] 요청 시작");

    let form;
    try {
      form = await req.formData();
    } catch (formError) {
      console.error("[Upload] FormData 파싱 실패:", formError);
      return json(
        {
          ok: false,
          error: "Invalid form data",
          hint: "요청 형식이 올바르지 않습니다.",
        },
        400
      );
    }

    const file = form.get("image");
    const pageId = String(form.get("page_id") || "").trim();

    if (!(file instanceof File)) {
      return json({ ok: false, error: "image field required" }, 400);
    }
    if (!pageId) {
      return json({ ok: false, error: "page_id required" }, 400);
    }

    const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
    console.log(
      `[Upload] 파일: ${file.name}, 크기: ${fileSizeMB}MB, 타입: ${file.type}`
    );

    // ✅ 파일 크기 제한: 10MB (안정성 향상)
    if (file.size > MAX_UPLOAD_SIZE) {
      return json(
        {
          ok: false,
          error: `too large (max ${MAX_UPLOAD_SIZE / 1024 / 1024}MB, current: ${fileSizeMB}MB)`,
          hint: "이미지를 더 작게 압축하거나 해상도를 낮춰주세요.",
        },
        413
      );
    }

    const ct = (file.type || "").toLowerCase();
    if (!/^image\/(jpeg|png|webp|avif)$/.test(ct)) {
      return json({ ok: false, error: `unsupported type: ${ct}` }, 415);
    }

    // ✅ 스트림 기반 처리: 메모리 효율성 향상
    let fileBuffer;
    try {
      fileBuffer = await file.arrayBuffer();
      console.log(
        `[Upload] ArrayBuffer 생성 완료: ${fileBuffer.byteLength} bytes`
      );
    } catch (bufferError) {
      console.error("[Upload] ArrayBuffer 생성 실패:", bufferError);
      return json(
        {
          ok: false,
          error: "Failed to read file",
          hint: "파일을 읽는 중 오류가 발생했습니다.",
        },
        500
      );
    }

    // ✅ Cloudflare Images 변환 (타임아웃 안전 처리)
    let imageResponse;
    try {
      console.log("[Upload] Cloudflare Images 변환 시작...");

      // 이미지 크기에 따라 리사이즈 폭 조절 (큰 이미지는 더 작게)
      const targetWidth = file.size > 5 * 1024 * 1024 ? 800 : 1000;

      const image = await env.IMAGES.input(fileBuffer)
        .transform({ width: targetWidth }) // 비율 유지, 가로만 축소
        .output({ format: "image/avif", quality: 82 });

      imageResponse = await image.response();
      console.log("[Upload] Cloudflare Images 변환 완료");
    } catch (imageError) {
      console.error("[Upload] Cloudflare Images 변환 실패:", imageError);
      const errorMsg = String(imageError);

      // CPU 시간 초과 감지
      if (
        errorMsg.includes("time") ||
        errorMsg.includes("limit") ||
        errorMsg.includes("exceeded")
      ) {
        return json(
          {
            ok: false,
            error: "Image processing timeout",
            hint: "이미지 처리 시간이 초과되었습니다. 더 작은 이미지(5MB 이하)로 시도해주세요.",
          },
          504
        );
      }

      return json(
        {
          ok: false,
          error: `Image processing failed: ${errorMsg}`,
          hint: "이미지 형식을 확인하거나 더 작은 파일로 시도해주세요.",
        },
        500
      );
    }

    const key = `images/${encodeURIComponent(pageId)}/${crypto.randomUUID()}.avif`;

    try {
      console.log(`[Upload] R2 업로드 시작: ${key}`);
      await env.R2_GALLERY.put(key, imageResponse.body, {
        httpMetadata: {
          contentType: "image/avif",
          cacheControl: "public, max-age=31536000, immutable",
        },
      });
      console.log("[Upload] R2 업로드 완료");
    } catch (r2Error) {
      console.error("[Upload] R2 업로드 실패:", r2Error);
      return json(
        {
          ok: false,
          error: `R2 upload failed: ${String(r2Error)}`,
        },
        500
      );
    }

    const publicUrl = `https://cdn.roarc.kr/${key}`;
    console.log(`[Upload] 성공: ${publicUrl}`);
    return json({ ok: true, url: publicUrl, key }, 200);
  } catch (e) {
    console.error("[Upload] 예상치 못한 오류:", e);
    return json(
      {
        ok: false,
        error: String(e),
        hint: "업로드 중 오류가 발생했습니다. 다시 시도해주세요.",
      },
      500
    );
  }
}

// =======================
//   삭제 핸들러
// =======================
async function handleDeleteGallery(req, env, json) {
  try {
    const body = await req.json();
    const pageId = String(body.page_id || "").trim();
    if (!pageId) {
      return json({ ok: false, error: "page_id required" }, 400);
    }

    const prefix = `images/${encodeURIComponent(pageId)}/`;
    let cursor;
    let deleted = 0;

    do {
      const list = await env.R2_GALLERY.list({ prefix, cursor, limit: 1000 });
      await Promise.all(list.objects.map((o) => env.R2_GALLERY.delete(o.key)));
      deleted += list.objects.length;
      cursor = list.cursor;
    } while (cursor);

    return json({ ok: true, deleted }, 200);
  } catch (e) {
    return json({ ok: false, error: String(e) }, 500);
  }
}
