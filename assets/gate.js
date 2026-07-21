/* ------------------------------------------------------------------ *
 * gate.js — shared password gate for the Court Forms Online previews.
 *
 * This is a LIGHT gate: it keeps casual visitors out of an internal
 * prototype. It is NOT real security — the password and the page HTML
 * are visible to anyone who opens browser dev tools. Do not put
 * anything confidential behind it. For real privacy, use Vercel
 * Deployment Protection or Cloudflare Access instead.
 *
 * To use on a page: add  <script src="assets/gate.js"></script>
 * as the FIRST element inside <body>.
 * ------------------------------------------------------------------ */
(function () {
  "use strict";

  // === The only line you change to set the password ===
  var PREVIEW_PASSWORD = "snap-preview";

  var FLAG_KEY = "cfo-preview-ok";

  // Already unlocked this session? Do nothing.
  try {
    if (sessionStorage.getItem(FLAG_KEY) === "1") return;
  } catch (e) {
    /* sessionStorage blocked (private mode edge cases) — show the gate anyway */
  }

  function unlock() {
    try { sessionStorage.setItem(FLAG_KEY, "1"); } catch (e) {}
    var el = document.getElementById("cfo-gate");
    if (el) el.remove();
  }

  function build() {
    var style = document.createElement("style");
    style.textContent =
      "#cfo-gate{position:fixed;inset:0;z-index:2147483647;" +
      "background:#0a2b52;color:#16202e;" +
      "font-family:'Atkinson Hyperlegible',system-ui,-apple-system,sans-serif;" +
      "display:flex;align-items:center;justify-content:center;padding:24px}" +
      "#cfo-gate .box{background:#fff;border-radius:20px;max-width:400px;width:100%;" +
      "padding:32px 28px;box-shadow:0 10px 40px rgba(0,0,0,.3)}" +
      "#cfo-gate .flag{width:26px;height:34px;border-radius:5px 5px 3px 3px;" +
      "background:linear-gradient(#f4bd3f,#e79a1f);position:relative;margin-bottom:18px}" +
      "#cfo-gate .flag span{position:absolute;left:50%;top:6px;transform:translateX(-50%);" +
      "width:4px;height:20px;background:#0a2b52;border-radius:2px}" +
      "#cfo-gate h1{font-size:21px;margin:0 0 6px;letter-spacing:-.01em}" +
      "#cfo-gate p{font-size:15px;color:#5b6675;margin:0 0 18px;line-height:1.45}" +
      "#cfo-gate label{display:block;font-size:14px;font-weight:700;margin-bottom:6px}" +
      "#cfo-gate input{width:100%;font-family:inherit;font-size:16px;padding:12px 14px;" +
      "border:2px solid #d3d9e2;border-radius:10px;background:#fff;color:#16202e}" +
      "#cfo-gate input:focus{outline:3px solid #0a2b52;outline-offset:1px;border-color:#134a8e}" +
      "#cfo-gate button{width:100%;margin-top:16px;font-family:inherit;font-size:16px;" +
      "font-weight:700;color:#fff;background:#134a8e;border:none;border-radius:10px;" +
      "padding:14px;cursor:pointer;box-shadow:0 2px 0 #0a2b52;min-height:48px}" +
      "#cfo-gate button:hover{background:#0a2b52}" +
      "#cfo-gate .err{color:#b42318;font-size:14px;font-weight:700;margin:12px 0 0;min-height:1.2em}";
    document.head.appendChild(style);

    var overlay = document.createElement("div");
    overlay.id = "cfo-gate";
    overlay.innerHTML =
      '<form class="box" autocomplete="off">' +
      '<div class="flag" aria-hidden="true"><span></span></div>' +
      "<h1>Internal preview</h1>" +
      "<p>These pages are shared with the team for feedback. Enter the password to continue.</p>" +
      '<label for="cfo-pw">Password</label>' +
      '<input id="cfo-pw" type="password" autocomplete="off" autofocus aria-describedby="cfo-err">' +
      '<button type="submit">Continue</button>' +
      '<p class="err" id="cfo-err" role="alert"></p>' +
      "</form>";
    document.body.appendChild(overlay);

    var form = overlay.querySelector("form");
    var input = overlay.querySelector("#cfo-pw");
    var err = overlay.querySelector("#cfo-err");

    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      if (input.value === PREVIEW_PASSWORD) {
        unlock();
      } else {
        err.textContent = "That password isn't right. Try again.";
        input.value = "";
        input.focus();
      }
    });
    input.focus();
  }

  if (document.body) {
    build();
  } else {
    document.addEventListener("DOMContentLoaded", build);
  }
})();
