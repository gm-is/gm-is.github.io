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

        // Full-screen request function for a specific element
        const requestFullScreen = (element) => {
            if (element.requestFullscreen) {
                element.requestFullscreen();
            } else if (element.webkitRequestFullscreen) { /* Safari */
                element.webkitRequestFullscreen();
            } else if (element.msRequestFullscreen) { /* IE11 */
                element.msRequestFullscreen();
            }
        };

        // Ensure the widget is loaded and then add click event listener for full-screen
        const enableWidgetFullScreen = () => {
            const widget = s.getElementById('widget-alltius'); // Replace 'widget-alltius' with your widget's actual ID
            if (widget) {
                widget.addEventListener("click", () => requestFullScreen(widget));
            } else {
                // If the widget isn't found, you might want to call enableWidgetFullScreen again later or handle this case differently.
                console.error("Widget not found. Make sure it's loaded before trying to enable full-screen.");
            }
        };

        // Call enableWidgetFullScreen when the document is fully loaded
        if (s.readyState === "complete") {
            enableWidgetFullScreen();
        } else {
            l.addEventListener("load", enableWidgetFullScreen);
        }
    };
    p(window, document, "alltius-sdk", "script");
})();



// (() => {const p=(l,s,a,i)=>{const n=()=>{if(!s.getElementById(a)){const e=s.getElementsByTagName(i)[0],t=s.createElement(i);t.type="text/javascript",t.async=!1,t.src="https://app.alltius.ai/alltiusSDK.js",t.id=a,e&&e.parentNode?e.parentNode.insertBefore(t,e):s.body.appendChild(t)}};if(!l.AlltiusSDK){const e=(...t)=>{e.q.push(t)};e.q=[],l.AlltiusSDK=e,s.readyState==="complete"?n():l.addEventListener("load",n)}};p(window,document,"alltius-sdk","script");})()


window.AlltiusSDK("configure", {
  metatadata: {
    widgetId: "65de8345a834629e1e2aa294",
  },
});
