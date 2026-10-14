(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.GairosMonsterToken = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  // Fit the visible subject inside the ring, including off-center faces and horns.
  // Opaque artwork is fitted in full rather than guessing where a face might be.
  function subjectFrame(pixels, width, height) {
    let left = width, top = height, right = -1, bottom = -1;
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        if (pixels[(y * width + x) * 4 + 3] < 16) continue;
        left = Math.min(left, x); right = Math.max(right, x);
        top = Math.min(top, y); bottom = Math.max(bottom, y);
      }
    }
    if (right < left) return { x: width / 2, y: height / 2, radius: Math.hypot(width, height) / 2 };
    const x = (left + right + 1) / 2;
    const y = (top + bottom + 1) / 2;
    // Bounding corners give a conservative fit: every visible feature survives.
    return { x, y, radius: Math.max(1, Math.hypot(right - left + 1, bottom - top + 1) / 2) };
  }

  async function load(dataUrl) {
    const image = new Image();
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = () => reject(new Error("Could not open this artwork. Try a PNG or JPEG image."));
      image.src = dataUrl;
    });
    if (!image.naturalWidth || image.naturalWidth * image.naturalHeight > 40_000_000) {
      throw new Error("Choose an image smaller than 40 megapixels.");
    }
    const sample = document.createElement("canvas");
    const ratio = Math.min(1, 512 / Math.max(image.naturalWidth, image.naturalHeight));
    sample.width = Math.max(1, Math.round(image.naturalWidth * ratio));
    sample.height = Math.max(1, Math.round(image.naturalHeight * ratio));
    const ctx = sample.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(image, 0, 0, sample.width, sample.height);
    const fit = subjectFrame(ctx.getImageData(0, 0, sample.width, sample.height).data, sample.width, sample.height);
    return { image, frame: { x: fit.x / ratio, y: fit.y / ratio, radius: fit.radius / ratio } };
  }

  function draw(canvas, artwork, options = {}) {
    const ctx = canvas.getContext("2d");
    const size = canvas.width;
    const center = size / 2;
    ctx.clearRect(0, 0, size, size);
    ctx.save();
    ctx.beginPath(); ctx.arc(center, center, size * .465, 0, Math.PI * 2); ctx.clip();
    const background = ctx.createRadialGradient(center, center * .8, 0, center, center, center);
    background.addColorStop(0, "#344554"); background.addColorStop(1, "#101820");
    ctx.fillStyle = background; ctx.fillRect(0, 0, size, size);
    if (artwork) {
      const scale = size * .425 / artwork.frame.radius * (Number(options.zoom) || 1);
      ctx.drawImage(artwork.image,
        center - artwork.frame.x * scale + (Number(options.x) || 0) * size / 100,
        center - artwork.frame.y * scale + (Number(options.y) || 0) * size / 100,
        artwork.image.naturalWidth * scale, artwork.image.naturalHeight * scale);
    }
    ctx.restore();
    ctx.beginPath(); ctx.arc(center, center, size * .462, 0, Math.PI * 2);
    ctx.lineWidth = size * .048; ctx.strokeStyle = options.color || "#bd965a"; ctx.stroke();
    for (const radius of [.438, .486]) {
      ctx.beginPath(); ctx.arc(center, center, size * radius, 0, Math.PI * 2);
      ctx.lineWidth = size * .005; ctx.strokeStyle = "#f6e4b3"; ctx.stroke();
    }
    return canvas;
  }
  return { subjectFrame, load, draw };
});
