/**
 * External Link Handler — TRM Labs (Global)
 * -------------------------------------------------------
 * Purpose
 * - Automatically open NON-TRM links in a new tab across the site (including CMS Rich Text).
 *
 * How it works
 * 1) Scans ALL <a> links on the page (not class-based)
 * 2) Skips non-navigation hrefs (#, mailto:, tel:, javascript:)
 * 3) Resolves the link hostname safely using URL()
 * 4) Treats as INTERNAL if:
 *    - relative URL (same origin)
 *    - same hostname as current site
 *    - belongs to TRM ecosystem (contains ".trmlabs." or ends with ".trmlabs")
 * 5) Everything else is EXTERNAL:
 *    - adds target="_blank" + rel="noopener noreferrer"
 *
 * Robustness
 * - Uses MutationObserver to catch CMS Rich Text / dynamic content injected after initial load
 *
 * Debug
 * - Set DEBUG=false to silence logs
 */

(function () {
  const DEBUG = true;

  // (Optional) If you ever need to exclude specific containers, add selectors here.
  // Example: const EXCLUDE_CONTAINERS = ['.navbar', '.footer'];
  const EXCLUDE_CONTAINERS = [];

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

  function isInsideExcludedContainer(linkEl) {
    if (!EXCLUDE_CONTAINERS.length) return false;
    return EXCLUDE_CONTAINERS.some((sel) => linkEl.closest(sel));
  }

  function getHostname(url) {
    try {
      // Supports relative URLs by resolving against current origin
      return new URL(url, window.location.origin).hostname.toLowerCase();
    } catch (err) {
      return null;
    }
  }

  function isInternalHostname(hostname) {
    if (!hostname) return true;

    const current = window.location.hostname.toLowerCase();

    // Same host (includes relative URLs resolved to same host)
    if (hostname === current) return true;

    // TRM ecosystem:
    // - event.trmlabs.com, docs.trmlabs.ai, etc
    // - also allows hostname exactly "trmlabs"
    if (
      hostname === INTERNAL_BRAND ||
      hostname.endsWith("." + INTERNAL_BRAND) ||
      hostname.includes("." + INTERNAL_BRAND + ".")
    ) {
      return true;
    }

    return false;
  }

  function markExternal(linkEl) {
    linkEl.setAttribute("target", "_blank");
    linkEl.setAttribute("rel", "noopener noreferrer");
    linkEl.dataset.externalLinkHandled = "true";
  }

  function markInternal(linkEl) {
    linkEl.dataset.externalLinkHandled = "true";
  }

  function shouldProcess(linkEl) {
    if (!linkEl || linkEl.tagName !== "A") return false;
    if (linkEl.dataset.externalLinkHandled === "true") return false; // idempotent
    if (isInsideExcludedContainer(linkEl)) return false;

    const href = linkEl.getAttribute("href");
    if (isSkippableHref(href)) return false;

    return true;
  }

  function processLink(linkEl) {
    const href = linkEl.getAttribute("href");
    const hostname = getHostname(href);
    const internal = isInternalHostname(hostname);

    if (DEBUG) {
      console.groupCollapsed("[ExternalLink]", href);
      console.log("Resolved hostname:", hostname);
      console.log("Internal:", internal);
    }

    if (!internal) {
      markExternal(linkEl);
      if (DEBUG) console.log("→ Converted to external (new tab)");
    } else {
      markInternal(linkEl);
      if (DEBUG) console.log("→ Kept internal (same tab)");
    }

    if (DEBUG) console.groupEnd();
  }

  function scan(root = document) {
    const links = root.querySelectorAll("a[href]");
    let processed = 0;

    links.forEach((linkEl) => {
      if (!shouldProcess(linkEl)) return;
      processLink(linkEl);
      processed++;
    });

    log(`Scan complete. Processed ${processed} links.`);
  }

  function initObserver() {
    // Watches for CMS Rich Text / dynamic injections
    const observer = new MutationObserver((mutations) => {
      let needsScan = false;

      for (const m of mutations) {
        if (m.type === "childList" && (m.addedNodes?.length || 0) > 0) {
          needsScan = true;
          break;
        }
      }

      if (needsScan) scan(document);
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });

    log("MutationObserver active.");
  }

  function init() {
    log("Init");
    scan(document);
    initObserver();
    // Expose a manual trigger for debugging
    window.ExternalLinkHandler = { scan };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
