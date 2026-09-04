/**
 * Rewrite stored image URLs that still point at local development.
 * Filenames/paths are preserved. Non-localhost URLs are left unchanged.
 */
function publicOrigin(req) {
  const envBase = (process.env.IMAGE_BASE_URL || "").replace(/\/$/, "");
  const envIsLocal =
    !envBase || /localhost|127\.0\.0\.1/i.test(envBase);

  const forwardedHost = req?.headers?.["x-forwarded-host"] || req?.headers?.host;
  const forwardedProto = req?.headers?.["x-forwarded-proto"];
  const host = String(forwardedHost || "")
    .split(",")[0]
    .trim();
  const proto = String(forwardedProto || req?.protocol || "http")
    .split(",")[0]
    .trim();

  if (envBase && !envIsLocal) return envBase;
  if (host && !/localhost|127\.0\.0\.1/i.test(host)) {
    return `${proto}://${host}`;
  }
  if (envBase) return envBase;
  if (host) return `${proto}://${host}`;
  return "http://localhost:5001";
}

function rewriteAssetUrl(url, origin) {
  if (!url || typeof url !== "string") return url;
  try {
    const parsed = new URL(url);
    if (
      parsed.hostname === "localhost" ||
      parsed.hostname === "127.0.0.1"
    ) {
      return `${origin}${parsed.pathname}`;
    }
  } catch {
    if (url.startsWith("/")) return `${origin}${url}`;
  }
  return url;
}

function rewriteImageList(images, origin) {
  if (!Array.isArray(images)) return images;
  return images.map((src) => rewriteAssetUrl(src, origin));
}

module.exports = {
  publicOrigin,
  rewriteAssetUrl,
  rewriteImageList,
};
