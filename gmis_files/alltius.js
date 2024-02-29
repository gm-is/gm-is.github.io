(() => {
  const p = (l, s, a, i) => {
    const n = () => {
      if (!s.getElementById(a)) {
        const e = s.getElementsByTagName(i)[0], t = s.createElement(i);
        t.type = "text/javascript";
        t.async = false;
        t.src = "https://app.alltius.ai/alltiusSDK.js";
        t.id = a;
        t.onload = tryEnterFullScreen; // Attempt to enter fullscreen after SDK loads
        e && e.parentNode ? e.parentNode.insertBefore(t, e) : s.body.appendChild(t);
      }
    };
    if (!l.AlltiusSDK) {
      const e = (...t) => { e.q.push(t); };
      e.q = [];
      l.AlltiusSDK = e;
      s.readyState === "complete" ? n() : l.addEventListener("load", n);
    }
  };
  p(window, document, "alltius-sdk", "script");
})();

function tryEnterFullScreen() {
  if (document.documentElement.requestFullscreen) {
    document.documentElement.requestFullscreen().catch((err) => {
      console.warn("Unable to enter fullscreen mode:", err.message);
    });
  }
}

window.AlltiusSDK("configure", {
  metadata: {
    widgetId: "65de8345a834629e1e2aa294",
  },
});
