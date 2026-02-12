<script>
/**
 * External Link Handler — TRM Labs
 * -------------------------------------------------------
 * Scans all `.absolute-link` elements and forces external
 * links to open in a new tab.
 *
 * Rules:
 * - Internal links (same hostname OR *.trmlabs.*) → normal behavior
 * - External links → target="_blank" + rel="noopener noreferrer"
 *
 * Why:
 * Prevents editors from accidentally navigating users away
 * from the marketing site while keeping security best practices.
 *
 * Safe against:
 * - relative URLs
 * - anchors (#)
 * - javascript links
 * - fake domains (trmlabs.evil.com)
 *
 * Author: ChatGPT for André Fuentes 😄
 */

(function () {
  const DEBUG = true;
  const SELECTOR = ".absolute-link";
  const INTERNAL_BRAND = "trmlabs";

  function log(...args) {
    if (!DEBUG) return;
    console.log("[ExternalLinkHandler]", ...args);
  }

  function isSkippableHref(href) {
    return (
      !href ||
      href.startsWith("#") ||
      href.startsWith("javascript:") ||
      href.startsWith("mailto:") ||
      href.startsWith("tel:")
    );
  }

  function getHostname(url) {
    try {
      return new URL(url, window.location.origin).hostname.toLowerCase();
    } catch {
      return null;
    }
  }

  function isInternal(hostname) {
    if (!hostname) return true;

    const current = window.location.hostname.toLowerCase();

    // same domain
    if (hostname === current) return true;

    // any *.trmlabs.*
    if (hostname === INTERNAL_BRAND || hostname.endsWith("." + INTERNAL_BRAND) || hostname.includes("." + INTERNAL_BRAND + ".")) {
      return true;
    }

    return false;
  }

  function processLink(link) {
    const href = link.getAttribute("href");
    if (isSkippableHref(href)) {
      log("Skip:", href);
      return;
    }

    const hostname = getHostname(href);
    const internal = isInternal(hostname);

    console.groupCollapsed("[ExternalLink]", href);
    console.log("Resolved hostname:", hostname);
    console.log("Internal:", internal);

    if (!internal) {
      link.setAttribute("target", "_blank");
      link.setAttribute("rel", "noopener noreferrer");
      console.log("→ Converted to external link");
    } else {
      console.log("→ Internal link kept normal");
    }

    console.groupEnd();
  }

  function init() {
    const links = document.querySelectorAll(SELECTOR);

    log(`Found ${links.length} .absolute-link elements`);

    links.forEach(processLink);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
</script>
