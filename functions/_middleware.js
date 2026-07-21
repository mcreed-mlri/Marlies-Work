/* ------------------------------------------------------------------ *
 * Cloudflare Pages Function — site-wide password gate.
 *
 * This runs on Cloudflare's edge for EVERY request, before any page or
 * asset is served. Unlike a client-side script, the password never
 * reaches the browser as source — it's read from an encrypted
 * environment variable. This is real, edge-enforced protection.
 *
 * Setup (in the Cloudflare Pages dashboard):
 *   Settings → Variables and secrets → add, for Production:
 *     SITE_PASSWORD = <your password>   (click "Encrypt" to store as a secret)
 *     SITE_USER     = <optional; defaults to "mlri">
 *   Then redeploy so the Function picks up the new value.
 *
 * Visitors get the browser's native username/password prompt. Serve
 * everyone the same credentials, or change them anytime by editing the
 * env var — no code change needed.
 * ------------------------------------------------------------------ */
export async function onRequest(context) {
  const { request, env, next } = context;

  const expectedUser = env.SITE_USER || "mlri";
  const expectedPass = env.SITE_PASSWORD;

  // Fail closed: if no password is configured, do NOT serve the site.
  if (!expectedPass) {
    return new Response(
      "This preview isn't configured yet (missing SITE_PASSWORD).",
      { status: 503 }
    );
  }

  const header = request.headers.get("Authorization") || "";
  if (header.startsWith("Basic ")) {
    let decoded = "";
    try {
      decoded = atob(header.slice(6));
    } catch (e) {
      decoded = "";
    }
    const sep = decoded.indexOf(":");
    const user = sep === -1 ? "" : decoded.slice(0, sep);
    const pass = sep === -1 ? "" : decoded.slice(sep + 1);

    if (user === expectedUser && pass === expectedPass) {
      return next(); // credentials OK → serve the requested page/asset
    }
  }

  return new Response("Authentication required.", {
    status: 401,
    headers: {
      "WWW-Authenticate":
        'Basic realm="Marlie\'s MLRI Work - preview", charset="UTF-8"',
    },
  });
}
