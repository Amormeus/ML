/* Keep the usable viewport stable while Edge's URL bar and Android rotation settle. */
(() => {
  const root = document.documentElement;
  let frame = 0;

  function updateViewportUnit() {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const viewport = window.visualViewport;
      const height = viewport ? viewport.height : window.innerHeight;
      const width = viewport ? viewport.width : window.innerWidth;
      root.style.setProperty('--app-height', `${Math.round(height)}px`);
      root.style.setProperty('--app-width', `${Math.round(width)}px`);
      root.dataset.orientation = width > height ? 'landscape' : 'portrait';
    });
  }

  updateViewportUnit();
  window.addEventListener('resize', updateViewportUnit, { passive: true });
  window.addEventListener('orientationchange', () => setTimeout(updateViewportUnit, 120), { passive: true });
  window.visualViewport?.addEventListener('resize', updateViewportUnit, { passive: true });
})();
