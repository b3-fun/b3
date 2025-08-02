// Replace Mintlify footer with Player1 Foundation copyright
(function () {
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
    // Try to replace immediately if DOM is already loaded
    if (replaceMintlifyFooter()) {
      return;
    }

    // Set up a MutationObserver to watch for DOM changes
    const observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
          if (replaceMintlifyFooter()) {
            observer.disconnect();
          }
        }
      });
    });

    // Start observing
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Fallback: try every 500ms for up to 10 seconds
    let attempts = 0;
    const maxAttempts = 20;
    const fallbackInterval = setInterval(function () {
      attempts++;
      if (replaceMintlifyFooter() || attempts >= maxAttempts) {
        clearInterval(fallbackInterval);
        observer.disconnect();
      }
    }, 500);
  }

  // Wait for DOM to be ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", waitAndReplace);
  } else {
    waitAndReplace();
  }
})();
