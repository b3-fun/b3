const GA4_MEASUREMENT_ID = "G-VER9DKJH87";

/**
 * Initialize Google Analytics 4
 */
const initializeGA4 = () => {
  // Only initialize in browser environment
  if (typeof window === "undefined") return;

  // Create gtag function if it doesn't exist
  if (!window.gtag) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      window.dataLayer.push(arguments);
    };
  }

  // Configure GA4
  window.gtag("js", new Date());
  window.gtag("config", GA4_MEASUREMENT_ID, {
    page_location: window.location.href,
    page_hostname: window.location.hostname,
  });
};

/**
 * Load Google Analytics 4 script and initialize
 */
export const loadGA4Script = () => {
  if (typeof window === "undefined") return;

  // Check if script is already loaded
  if (document.querySelector(`script[src*="${GA4_MEASUREMENT_ID}"]`)) return;

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  script.onload = initializeGA4;
};

/**
 * Send an analytics event to Google Analytics 4
 * @param eventName - The name of the event to track
 * @param parameters - Additional parameters to include with the event
 */
export const sendGA4Event = (eventName: string, parameters?: Record<string, any>) => {
  // Only send events in browser environment
  if (typeof window === "undefined" || !window.gtag) return;

  // Send event to GA4
  window.gtag("event", eventName, parameters || {});
};
