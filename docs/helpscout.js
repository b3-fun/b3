// HelpScout Beacon
!(function (e, t, n) {
  function a() {
    var e = t.getElementsByTagName("script")[0],
      n = t.createElement("script");
    ((n.type = "text/javascript"),
      (n.async = !0),
      (n.src = "https://beacon-v2.helpscout.net"),
      e.parentNode.insertBefore(n, e));
  }
  if (
    ((e.Beacon = n =
      function (t, n, a) {
        e.Beacon.readyQueue.push({ method: t, options: n, data: a });
      }),
    (n.readyQueue = []),
    "complete" === t.readyState)
  )
    return a();
  e.attachEvent ? e.attachEvent("onload", a) : e.addEventListener("load", a, !1);
})(window, document, window.Beacon || function () {});

// Initialize HelpScout Beacon
window.Beacon("init", "8e2de628-b2e0-4bb8-96d1-0b7127673094");
