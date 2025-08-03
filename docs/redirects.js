// Custom redirect handler for B3 SDK documentation
(function () {
  // Map of redirect paths to their destinations
  const redirectMap = {
    "/redirect/sdk": "/sdk/introduction",
    "/redirect/ecosystem": "/ecosystem/introduction",
  };

  // Function to check and perform redirects
  function checkForRedirects() {
    const currentPath = window.location.pathname;

    // Check if current path needs redirection
    for (const [fromPath, toPath] of Object.entries(redirectMap)) {
      if (currentPath === fromPath || currentPath === fromPath + "/") {
        // Perform redirect
        window.location.replace(toPath);
        return;
      }
    }

    // Handle case where URL contains the redirect path but might have additional segments
    for (const [fromPath, toPath] of Object.entries(redirectMap)) {
      if (currentPath.startsWith(fromPath + "/") && currentPath !== fromPath) {
        // Extract any additional path segments and append to destination
        const additionalPath = currentPath.substring(fromPath.length);
        window.location.replace(toPath + additionalPath);
        return;
      }
    }
  }

  // Run on initial load
  checkForRedirects();

  // Listen for browser navigation (back/forward buttons)
  window.addEventListener("popstate", checkForRedirects);

  // Listen for pushState/replaceState changes (programmatic navigation)
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function () {
    originalPushState.apply(history, arguments);
    setTimeout(checkForRedirects, 0);
  };

  history.replaceState = function () {
    originalReplaceState.apply(history, arguments);
    setTimeout(checkForRedirects, 0);
  };

  // Additional fallback: Watch for URL changes using an interval
  let lastUrl = window.location.href;
  setInterval(() => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      checkForRedirects();
    }
  }, 100);
})();
