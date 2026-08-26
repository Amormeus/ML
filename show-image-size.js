// Attach a small badge showing the image's original pixel dimensions.
// Usage: add `data-show-size` to any <img> you want to show the badge for.
//
// The script auto-runs on DOMContentLoaded and watches the document for new images.
// It reads naturalWidth/naturalHeight and shows them as "W × H px".
(function () {
  function formatSize(w, h) {
    return w + " × " + h + " px";
  }

  function createBadge() {
    const badge = document.createElement("div");
    badge.className = "img-size-badge";
    badge.setAttribute("aria-hidden", "true");
    return badge;
  }

  function attachToImage(img) {
    if (!img || img.__sizeBadgeAttached) return;
    img.__sizeBadgeAttached = true;

    // wrap image if it doesn't already have a positioned parent
    let wrap = img.closest(".img-wrap");
    if (!wrap) {
      wrap = document.createElement("span");
      wrap.className = "img-wrap";
      img.parentNode.insertBefore(wrap, img);
      wrap.appendChild(img);
    }

    const badge = createBadge();
    wrap.appendChild(badge);

    function update() {
      if (!img.naturalWidth || !img.naturalHeight) {
        // show placeholder until loaded
        badge.textContent = "…";
        return;
      }
      badge.textContent = formatSize(img.naturalWidth, img.naturalHeight);
    }

    // initial update if already loaded
    if (img.complete) update();
    img.addEventListener("load", update);

    // observe src changes to refresh when image swaps
    const obs = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === "attributes" && m.attributeName === "src") {
          badge.textContent = "…";
          // wait for load listener to update
        }
      }
    });
    obs.observe(img, { attributes: true });

    img.__sizeBadgeObserver = obs;
  }

  function attachSizeBadges(root = document) {
    const imgs = root.querySelectorAll("img[data-show-size]");
    imgs.forEach(attachToImage);
  }

  document.addEventListener("DOMContentLoaded", () => attachSizeBadges(document));

  // watch for new nodes added later
  const bodyObserver = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (!m.addedNodes) continue;
      m.addedNodes.forEach((node) => {
        if (node.nodeType !== 1) return;
        if (node.matches && node.matches("img[data-show-size]")) attachToImage(node);
        // also scan descendants
        attachSizeBadges(node);
      });
    }
  });
  bodyObserver.observe(document.documentElement || document.body, { childList: true, subtree: true });

  // expose API
  window.attachSizeBadges = attachSizeBadges;
})();
