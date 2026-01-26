// This script can be pasted into a browser's developer console to inject the dataLayer.js script into a website.
// The script assumes that the tracking_validation service is running on http://localhost:3000.
// If the service is running on a different URL, you need to update the script.src accordingly.

(function () {
  console.log("Injecting dataLayer.js script...");
  var script = document.createElement("script");
  script.src =
    "http://localhost:3000/static/dataLayer.js?schema_url=https://tracking-docs-demo.buchert.digital/schemas/1.2.0/event-reference.json";
  script.onload = function () {
    console.log("dataLayer.js script injected successfully.");
  };
  script.onerror = function () {
    console.error("Failed to inject dataLayer.js script.");
  };
  document.body.appendChild(script);
})();
