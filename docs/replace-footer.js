// Replace Mintlify footer with Player1 Foundation copyright
(function () {
  let currentObserver = null;
  let currentInterval = null;

  function replaceMintlifyFooter() {
    // Look for the "Powered by Mintlify" link
    const mintlifyLink = document.querySelector('a[href*="mintlify.com/preview-request"]');

    if (mintlifyLink) {
      // Create a new link element with Player1 Foundation copyright
      const copyrightElement = document.createElement("a");
      const currentYear = new Date().getFullYear();
      copyrightElement.textContent = `© Copyright ${currentYear} - Player1 Foundation`;
      copyrightElement.className =
        "text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300";
      copyrightElement.href = "https://p1f.org/";
      copyrightElement.target = "_blank";
      copyrightElement.rel = "noreferrer";

      // Replace the Mintlify link with the copyright notice
      mintlifyLink.parentNode.replaceChild(copyrightElement, mintlifyLink);

      return true;
    }

    return false;
  }

  // Function to wait for element and replace it
  function waitAndReplace() {
    // Clean up previous observer and interval
    if (currentObserver) {
      currentObserver.disconnect();
      currentObserver = null;
    }
    if (currentInterval) {
      clearInterval(currentInterval);
      currentInterval = null;
    }

    // Try to replace immediately if DOM is already loaded
    if (replaceMintlifyFooter()) {
      return;
    }

    // Set up a MutationObserver to watch for DOM changes
    currentObserver = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
          if (replaceMintlifyFooter()) {
            currentObserver.disconnect();
            currentObserver = null;
          }
        }
      });
    });

    // Start observing
    currentObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Fallback: try every 500ms for up to 10 seconds
    let attempts = 0;
    const maxAttempts = 20;
    currentInterval = setInterval(function () {
      attempts++;
      if (replaceMintlifyFooter() || attempts >= maxAttempts) {
        clearInterval(currentInterval);
        currentInterval = null;
        if (currentObserver) {
          currentObserver.disconnect();
          currentObserver = null;
        }
      }
    }, 500);
  }

  // Function to handle navigation changes
  function handleNavigation() {
    // Small delay to ensure the new page content has loaded
    setTimeout(waitAndReplace, 100);
  }

  // Run on initial load
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", waitAndReplace);
  } else {
    waitAndReplace();
  }

  // Listen for browser navigation (back/forward buttons)
  window.addEventListener("popstate", handleNavigation);

  // Listen for pushState/replaceState changes (programmatic navigation)
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function () {
    originalPushState.apply(history, arguments);
    handleNavigation();
  };

  history.replaceState = function () {
    originalReplaceState.apply(history, arguments);
    handleNavigation();
  };

  // Additional fallback: Watch for URL changes using an interval
  let lastUrl = window.location.href;
  setInterval(() => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      handleNavigation();
    }
  }, 100);
})();
