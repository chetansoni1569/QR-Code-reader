/* ============================================
   QR Code Generator — app.js
   ============================================ */

(function () {
  "use strict";

  /* ── DOM References ─────────────────────────── */
  const urlInput      = document.getElementById("url-input");
  const inputWrapper  = document.getElementById("input-wrapper");
  const clearBtn      = document.getElementById("clear-btn");
  const generateBtn   = document.getElementById("generate-btn");
  const errorMsg      = document.getElementById("error-message");
  const qrOutput      = document.getElementById("qr-output");
  const qrDisplay     = document.getElementById("qr-code-display");
  const qrUrlLabel    = document.getElementById("qr-url-label");
  const downloadBtn   = document.getElementById("download-btn");

  /* ── State ──────────────────────────────────── */
  let qrInstance = null;   // holds the QRCode object
  let lastUrl    = "";     // the URL that was last encoded

  /* ── Helpers ────────────────────────────────── */

  /**
   * Basic URL validation.
   * Accepts http:// and https:// URLs.
   */
  function isValidUrl(str) {
    try {
      const url = new URL(str.trim());
      return url.protocol === "http:" || url.protocol === "https:";
    } catch (_) {
      return false;
    }
  }

  /** Show an error message under the input */
  function showError(message) {
    errorMsg.textContent = "⚠ " + message;
    errorMsg.classList.add("visible");
    inputWrapper.classList.add("error-state");
  }

  /** Clear any displayed error */
  function clearError() {
    errorMsg.textContent = "";
    errorMsg.classList.remove("visible");
    inputWrapper.classList.remove("error-state");
  }

  /** Hide the QR output section */
  function hideQrOutput() {
    qrOutput.classList.remove("visible");
  }

  /**
   * Generate (or re-generate) a QR code for the given URL.
   * The QR code will encode exactly the URL so any scanner
   * immediately redirects to it.
   */
  function generateQRCode(url) {
    // Clear the previous QR code completely
    qrDisplay.innerHTML = "";

    // QRCode size – 220 px looks great on all screens
    const SIZE = 220;

    qrInstance = new QRCode(qrDisplay, {
      text:           url,
      width:          SIZE,
      height:         SIZE,
      colorDark:      "#111827",   // near-black modules
      colorLight:     "#ffffff",   // white background
      correctLevel:   QRCode.CorrectLevel.H,  // highest error-correction
    });

    // Show URL label (truncate if very long)
    qrUrlLabel.textContent = url.length > 60
      ? url.substring(0, 57) + "…"
      : url;

    // Reveal the output section
    qrOutput.classList.remove("visible"); // reset animation
    void qrOutput.offsetWidth;            // force reflow
    qrOutput.classList.add("visible");

    lastUrl = url;
  }

  /**
   * Download the QR code canvas as a PNG file.
   * The library renders a <canvas>; we pull out its data-URL.
   */
  function downloadQRCode() {
    const canvas = qrDisplay.querySelector("canvas");

    if (!canvas) {
      // Fallback: try img element (some browsers / older lib versions)
      const img = qrDisplay.querySelector("img");
      if (img) {
        const a = document.createElement("a");
        a.href = img.src;
        a.download = buildFileName();
        a.click();
      }
      return;
    }

    // Canvas approach — most reliable, stays scannable after download
    const dataUrl = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = buildFileName();
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  /** Build a safe filename from the encoded URL */
  function buildFileName() {
    try {
      const { hostname, pathname } = new URL(lastUrl);
      const slug = (hostname + pathname)
        .replace(/[^a-z0-9]/gi, "_")
        .replace(/_+/g, "_")
        .replace(/^_|_$/g, "")
        .substring(0, 48);
      return "qr_" + slug + ".png";
    } catch (_) {
      return "qr_code.png";
    }
  }

  /* ── Event Listeners ────────────────────────── */

  // Show / hide the ✕ clear button
  urlInput.addEventListener("input", function () {
    clearBtn.style.display = this.value.length > 0 ? "flex" : "none";
    if (this.value.length === 0) {
      clearError();
      hideQrOutput();
    }
  });

  // Clear button resets everything
  clearBtn.addEventListener("click", function () {
    urlInput.value = "";
    clearBtn.style.display = "none";
    clearError();
    hideQrOutput();
    urlInput.focus();
  });

  // Remove error styling when user starts typing again
  urlInput.addEventListener("focus", function () {
    if (inputWrapper.classList.contains("error-state")) {
      clearError();
    }
  });

  // Allow pressing Enter to generate
  urlInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      generateBtn.click();
    }
  });

  // Main generate action
  generateBtn.addEventListener("click", function () {
    const rawValue = urlInput.value.trim();

    // Validation: empty
    if (!rawValue) {
      showError("Please enter a URL before generating.");
      urlInput.focus();
      return;
    }

    // Auto-prepend https:// if user forgot the protocol
    let url = rawValue;
    if (!/^https?:\/\//i.test(url)) {
      url = "https://" + url;
    }

    // Validation: invalid URL
    if (!isValidUrl(url)) {
      showError("That doesn't look like a valid URL. Try: https://example.com");
      urlInput.focus();
      return;
    }

    // All good — clear error and generate
    clearError();
    generateQRCode(url);
  });

  // Download button
  downloadBtn.addEventListener("click", downloadQRCode);

})();
