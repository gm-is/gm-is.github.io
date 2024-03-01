(() => {
    const p = (l, s, a, i) => {
        const n = () => {
            if (!s.getElementById(a)) {
                const e = s.getElementsByTagName(i)[0],
                    t = s.createElement(i);
                t.type = "text/javascript";
                t.async = false;
                t.src = "https://app.alltius.ai/alltiusSDK.js";
                t.id = a;
                e && e.parentNode ? e.parentNode.insertBefore(t, e) : s.body.appendChild(t);
            }
        };
        if (!l.AlltiusSDK) {
            const e = (...t) => {
                e.q.push(t);
            };
            e.q = [];
            l.AlltiusSDK = e;
            s.readyState === "complete" ? n() : l.addEventListener("load", n);
        }

        // Full-screen request function
        const requestFullScreen = (element) => {
            if (element.requestFullscreen) {
                element.requestFullscreen();
            } else if (element.webkitRequestFullscreen) { /* Safari */
                element.webkitRequestFullscreen();
            } else if (element.msRequestFullscreen) { /* IE11 */
                element.msRequestFullscreen();
            }
        };

        // Add click event listener to the document body
        s.body.addEventListener("click", () => requestFullScreen(s.documentElement)); // Using documentElement to make the whole page go full screen
    };
    p(window, document, "alltius-sdk", "script");
})();


// (() => {const p=(l,s,a,i)=>{const n=()=>{if(!s.getElementById(a)){const e=s.getElementsByTagName(i)[0],t=s.createElement(i);t.type="text/javascript",t.async=!1,t.src="https://app.alltius.ai/alltiusSDK.js",t.id=a,e&&e.parentNode?e.parentNode.insertBefore(t,e):s.body.appendChild(t)}};if(!l.AlltiusSDK){const e=(...t)=>{e.q.push(t)};e.q=[],l.AlltiusSDK=e,s.readyState==="complete"?n():l.addEventListener("load",n)}};p(window,document,"alltius-sdk","script");})()


window.AlltiusSDK("configure", {
  metatadata: {
    widgetId: "65de8345a834629e1e2aa294",
  },
});
