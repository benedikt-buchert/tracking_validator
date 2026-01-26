(function () {
  "use strict";

  const scriptUrl = new URL(document.currentScript.src);
  const scriptHost = scriptUrl.origin;
  const schemaUrl = scriptUrl.searchParams.get("schema_url");
  const validationEndpoint = `${scriptHost}/v1/validate/remote`;

  // Ensure dataLayer exists
  window.dataLayer = window.dataLayer || [];

  const originalPush = Array.prototype.push.bind(window.dataLayer);

  function shouldValidate(event) {
    if (typeof event !== "object" || event === null || !event.event) {
      return false;
    }
    return (
      !event.event.startsWith("gtm.") && !event.event.startsWith("validator.")
    );
  }

  function sendValidationRequest(event) {
    return fetch(
      `${validationEndpoint}?schema_url=${encodeURIComponent(schemaUrl)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      },
    );
  }

  async function handleValidationResponse(response, event) {
    const data = await response.json();
    const eventName = data.valid ? "validator.valid" : "validator.error";
    originalPush({
      event: eventName,
      validatedEvent: event,
      validationResponse: data,
      $schema: schemaUrl,
    });
  }

  function handleValidationError(error, event) {
    console.error("Validation request failed:", error);
    originalPush({
      event: "validator.tool_error",
      validatedEvent: event,
      validationResponse: {
        valid: false,
        errors: [{ message: "Validation request failed" }],
        toolError: error.message,
      },
      $schema: schemaUrl,
    });
  }

  async function validateEvent(event) {
    if (!shouldValidate(event)) {
      return;
    }

    try {
      const response = await sendValidationRequest(event);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      await handleValidationResponse(response, event);
    } catch (error) {
      handleValidationError(error, event);
    }
  }

  // Process events that are already in the dataLayer
  // Use Array.prototype.slice.call to handle cases where dataLayer is not a true array
  const existingEvents = Array.prototype.slice.call(window.dataLayer);
  existingEvents.forEach(validateEvent);

  // Override the push method
  window.dataLayer.push = function () {
    const result = originalPush.apply(window.dataLayer, arguments);
    Array.from(arguments).forEach(validateEvent);
    return result;
  };
})();
