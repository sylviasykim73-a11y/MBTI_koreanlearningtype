/**
 * Korean Learning Type - Share card generation & sharing
 * Draws a 4:5 result card on a <canvas> using only the Canvas 2D API
 * (no external image/library dependencies), then offers Save / Web Share / Copy Link.
 */

const SHARE_BRAND_NAME = "SEOULTECH"; // swap for another campus brand if needed

function wrapCanvasText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";
  let cursorY = y;
  words.forEach((word, i) => {
    const testLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, cursorY);
      line = word;
      cursorY += lineHeight;
    } else {
      line = testLine;
    }
  });
  if (line) ctx.fillText(line, x, cursorY);
  return cursorY + lineHeight;
}

function drawShareCard(canvas, { profile, finalType, percentages, nickname }) {
  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, "#6c4cff");
  grad.addColorStop(1, "#ff5da2");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Decorative soft circles
  ctx.globalAlpha = 0.12;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath(); ctx.arc(W * 0.85, H * 0.08, 220, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(W * 0.1, H * 0.92, 260, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;

  // Card panel
  const pad = 64;
  const panelY = 120;
  const panelH = H - panelY - 100;
  ctx.fillStyle = "rgba(255,255,255,0.97)";
  roundRect(ctx, pad, panelY, W - pad * 2, panelH, 48);
  ctx.fill();

  ctx.textAlign = "center";
  ctx.fillStyle = "#5c5870";
  ctx.font = "700 30px sans-serif";
  ctx.fillText("MY KOREAN LEARNING TYPE", W / 2, 70);

  // Emoji
  ctx.font = "150px sans-serif";
  ctx.fillText(profile.emoji, W / 2, panelY + 160);

  // Code
  ctx.fillStyle = "#4f31e0";
  ctx.font = "900 64px sans-serif";
  ctx.fillText(finalType, W / 2, panelY + 250);

  // Title
  ctx.fillStyle = "#1c1a2e";
  ctx.font = "800 46px sans-serif";
  ctx.fillText(profile.titleKo, W / 2, panelY + 320);

  ctx.fillStyle = "#5c5870";
  ctx.font = "italic 28px sans-serif";
  ctx.fillText(profile.titleEn, W / 2, panelY + 362);

  // Axis bars
  const axisLabels = [
    { key: "EI", left: "E", right: "I", leftLabel: "PEOPLE", rightLabel: "FOCUS" },
    { key: "SN", left: "S", right: "N", leftLabel: "PRACTICE", rightLabel: "IDEAS" },
    { key: "TF", left: "T", right: "F", leftLabel: "LOGIC", rightLabel: "HEART" },
    { key: "JP", left: "J", right: "P", leftLabel: "PLAN", rightLabel: "FLEX" },
  ];
  let barY = panelY + 430;
  const barX = pad + 60;
  const barW = W - pad * 2 - 120;
  const barH = 26;

  axisLabels.forEach((a) => {
    const winner = finalType.includes(a.left) ? a.left : a.right;
    const pct = percentages[a.key][winner];
    const label = winner === a.left ? a.leftLabel : a.rightLabel;

    ctx.textAlign = "left";
    ctx.fillStyle = "#1c1a2e";
    ctx.font = "700 26px sans-serif";
    ctx.fillText(label, barX, barY - 12);
    ctx.textAlign = "right";
    ctx.fillText(`${pct}%`, barX + barW, barY - 12);

    ctx.fillStyle = "#ece7fb";
    roundRect(ctx, barX, barY, barW, barH, 13);
    ctx.fill();

    const fillGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
    fillGrad.addColorStop(0, "#6c4cff");
    fillGrad.addColorStop(1, "#ff5da2");
    ctx.fillStyle = fillGrad;
    roundRect(ctx, barX, barY, barW * (pct / 100), barH, 13);
    ctx.fill();

    barY += 78;
  });

  // Quote (tagline)
  ctx.textAlign = "center";
  ctx.fillStyle = "#4f31e0";
  ctx.font = "italic 700 30px sans-serif";
  wrapCanvasText(ctx, `“${profile.taglineKo}”`, W / 2, barY + 40, barW, 40);

  // Nickname (optional)
  if (nickname) {
    ctx.fillStyle = "#5c5870";
    ctx.font = "600 26px sans-serif";
    ctx.fillText(nickname, W / 2, panelY + panelH - 30);
  }

  // Footer brand
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 32px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(SHARE_BRAND_NAME, W / 2, H - 40);
}

function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function canvasToBlob(canvas) {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

async function downloadShareCard(canvas, filename) {
  const blob = await canvasToBlob(canvas);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

async function shareResultCard(canvas, { text }) {
  const blob = await canvasToBlob(canvas);
  const file = new File([blob], "korean-learning-type.png", { type: "image/png" });

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], text, title: "Korean Learning Type" });
      return { method: "web-share-file" };
    } catch (e) {
      if (e && e.name === "AbortError") return { method: "cancelled" };
    }
  }

  if (navigator.share) {
    try {
      await navigator.share({ text, title: "Korean Learning Type", url: location.href });
      return { method: "web-share-text" };
    } catch (e) {
      if (e && e.name === "AbortError") return { method: "cancelled" };
    }
  }

  return { method: "unsupported" };
}

async function copyResultLink(text) {
  const payload = `${text}\n${location.href}`;
  try {
    await navigator.clipboard.writeText(payload);
    return true;
  } catch (e) {
    return false;
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { drawShareCard, downloadShareCard, shareResultCard, copyResultLink };
}
