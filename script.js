const fileInput = document.getElementById("fileInput");
const addBtn = document.getElementById("addBtn");
const emptyAddBtn = document.getElementById("emptyAddBtn");
const tabNav = document.getElementById("tabNav");
const statsBar = document.getElementById("statsBar");
const toolbarWrapper = document.getElementById("toolbarWrapper");
const transformPanel = document.getElementById("transformPanel");
const resizePanel = document.getElementById("resizePanel");
const imageGrid = document.getElementById("imageGrid");
const emptyState = document.getElementById("emptyState");
const footer = document.getElementById("footer");

const imageCountEl = document.getElementById("imageCount");

const resizeWidthInput = document.getElementById("resizeWidth");
const resizeHeightInput = document.getElementById("resizeHeight");
const lockAspectCheckbox = document.getElementById("lockAspect");

const MAX_IMAGES = 1000;
let images = [];
let idCounter = 0;
let currentTab = "transform";
let aspects = {};
let lastEditedResize = null;

// --- Tabs ---
document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".tab-btn")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentTab = btn.dataset.tab;
    switchTab();
  });
});

function switchTab() {
  if (currentTab === "transform") {
    transformPanel.style.display = "";
    resizePanel.style.display = "none";
    toolbarWrapper.style.display = images.length ? "" : "none";
  } else {
    transformPanel.style.display = "none";
    resizePanel.style.display = "";
  }
}

// --- Upload ---
addBtn.addEventListener("click", () => fileInput.click());
emptyAddBtn.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", () => {
  if (fileInput.files.length) handleFiles(fileInput.files);
  fileInput.value = "";
});

window.addEventListener("dragover", (e) => e.preventDefault());
window.addEventListener("drop", (e) => {
  e.preventDefault();
  if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
});

function handleFiles(fileList) {
  const files = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
  const remaining = MAX_IMAGES - images.length;
  const toProcess = files.slice(0, remaining);

  toProcess.forEach((file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const id = ++idCounter;
        aspects[id] = img.width / img.height;
        images.push({ id, file, img, rotation: 0, flipH: false, flipV: false });
        renderCard(id);
        updateUI();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function updateUI() {
  const hasImages = images.length > 0;
  tabNav.style.display = hasImages ? "" : "none";
  statsBar.style.display = hasImages ? "" : "none";
  footer.style.display = hasImages ? "" : "none";
  emptyState.style.display = hasImages ? "none" : "";

  if (hasImages) switchTab();
  else {
    transformPanel.style.display = "none";
    resizePanel.style.display = "none";
  }

  imageCountEl.textContent = images.length;
}

// --- Render Card ---
function renderCard(id) {
  const item = images.find((i) => i.id === id);
  if (!item) return;

  const col = document.createElement("div");
  col.className = "col-6 col-md-4 col-lg-3 col-xl-2";
  col.dataset.id = id;

  const name = item.file.name;
  const size = `${item.img.width} × ${item.img.height}`;

  col.innerHTML = `
    <div class="img-card">
      <canvas></canvas>
      <div class="img-info">
        <div class="img-name" title="${name}">${name}</div>
        <div class="img-dimensions" data-id="${id}">${size}</div>
      </div>
    </div>
  `;
  imageGrid.appendChild(col);
  drawCanvas(item);
}

// --- Draw ---
function drawCanvas(item) {
  const card = imageGrid.querySelector(`[data-id="${item.id}"]`);
  if (!card) return;
  const canvas = card.querySelector("canvas");
  const ctx = canvas.getContext("2d");
  const { width, height } = item.img;
  const isRot90 = item.rotation % 180 !== 0;
  canvas.width = isRot90 ? height : width;
  canvas.height = isRot90 ? width : height;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((item.rotation * Math.PI) / 180);
  ctx.scale(item.flipH ? -1 : 1, item.flipV ? -1 : 1);
  ctx.drawImage(item.img, -width / 2, -height / 2, width, height);
  ctx.restore();

  const dimEl = card.querySelector(`.img-dimensions[data-id="${item.id}"]`);
  if (dimEl) dimEl.textContent = `${canvas.width} × ${canvas.height}`;
}

// --- Transform Toolbar ---
document.querySelectorAll("[data-rotate]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const deg = parseInt(btn.dataset.rotate);
    images.forEach((item) => {
      item.rotation = (item.rotation + deg) % 360;
      drawCanvas(item);
    });
  });
});

document.querySelectorAll("[data-mirror]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const dir = btn.dataset.mirror;
    images.forEach((item) => {
      if (dir === "h") item.flipH = !item.flipH;
      else item.flipV = !item.flipV;
      drawCanvas(item);
    });
  });
});

document.getElementById("resetAllBtn").addEventListener("click", () => {
  images.forEach((item) => {
    item.rotation = 0;
    item.flipH = false;
    item.flipV = false;
    drawCanvas(item);
  });
});

// --- Resize ---
resizeWidthInput.addEventListener("input", () => {
  if (lockAspectCheckbox.checked && lastEditedResize !== "width") {
    const w = parseFloat(resizeWidthInput.value);
    if (!isNaN(w) && w > 0 && images.length && aspects[images[0].id]) {
      resizeHeightInput.value = Math.round(w / aspects[images[0].id]);
    }
  }
  lastEditedResize = "width";
});

resizeHeightInput.addEventListener("input", () => {
  if (lockAspectCheckbox.checked && lastEditedResize !== "height") {
    const h = parseFloat(resizeHeightInput.value);
    if (!isNaN(h) && h > 0 && images.length && aspects[images[0].id]) {
      resizeWidthInput.value = Math.round(h * aspects[images[0].id]);
    }
  }
  lastEditedResize = "height";
});

document.querySelectorAll(".chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    resizeWidthInput.value = chip.dataset.w;
    resizeHeightInput.value = chip.dataset.h;
    lastEditedResize = null;
  });
});

document.getElementById("applyResize").addEventListener("click", () => {
  if (!images.length) return;

  const targetW = parseFloat(resizeWidthInput.value);
  const targetH = parseFloat(resizeHeightInput.value);

  if (isNaN(targetW) && isNaN(targetH)) {
    alert("Please enter at least width or height.");
    return;
  }

  images.forEach((item) => {
    const origW = item.img.width;
    const origH = item.img.height;
    let newW, newH;

    if (!isNaN(targetW) && !isNaN(targetH)) {
      newW = targetW;
      newH = targetH;
    } else if (!isNaN(targetW)) {
      newW = targetW;
      newH = Math.round(targetW / (origW / origH));
    } else {
      newH = targetH;
      newW = Math.round(targetH * (origW / origH));
    }

    if (newW < 1 || newH < 1 || newW > 10000 || newH > 10000) return;

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = newW;
    tempCanvas.height = newH;
    const tempCtx = tempCanvas.getContext("2d");
    tempCtx.drawImage(item.img, 0, 0, newW, newH);

    const newImg = new Image();
    newImg.onload = () => {
      item.img = newImg;
      aspects[item.id] = newW / newH;
      item.rotation = 0;
      item.flipH = false;
      item.flipV = false;
      drawCanvas(item);
    };
    newImg.src = tempCanvas.toDataURL("image/png");
  });

  document.getElementById("downloadResizedBtn").disabled = false;
});

// --- Clear All ---
document.getElementById("clearAllBtn").addEventListener("click", () => {
  images = [];
  aspects = {};
  imageGrid.innerHTML = "";
  resizeWidthInput.value = "";
  resizeHeightInput.value = "";
  document.getElementById("downloadResizedBtn").disabled = true;
  updateUI();
});

// --- Download ---
function getTransformedCanvas(item) {
  const c = document.createElement("canvas");
  const ctx = c.getContext("2d");
  const { width, height } = item.img;
  const isRot90 = item.rotation % 180 !== 0;
  c.width = isRot90 ? height : width;
  c.height = isRot90 ? width : height;

  ctx.clearRect(0, 0, c.width, c.height);
  ctx.save();
  ctx.translate(c.width / 2, c.height / 2);
  ctx.rotate((item.rotation * Math.PI) / 180);
  ctx.scale(item.flipH ? -1 : 1, item.flipV ? -1 : 1);
  ctx.drawImage(item.img, -width / 2, -height / 2, width, height);
  ctx.restore();
  return c;
}

document
  .getElementById("downloadAllBtn")
  .addEventListener("click", async () => {
    if (!images.length) return;
    const btn = document.getElementById("downloadAllBtn");
    const zipInput = document.getElementById("zipFilename");
    let zipName = zipInput.value.trim() || "transformed_images";
    zipName = zipName.replace(/\.zip$/i, "");

    btn.disabled = true;
    btn.innerHTML =
      '<span class="spinner-border spinner-border-sm"></span> Processing...';

    const zip = new JSZip();
    images.forEach((item) => {
      const canvas = getTransformedCanvas(item);
      const dataUrl = canvas.toDataURL("image/png").split(",")[1];
      zip.file(
        "transformed_" + item.file.name.replace(/\.[^.]+$/, "") + ".png",
        dataUrl,
        { base64: true },
      );
    });

    const blob = await zip.generateAsync({ type: "blob" });
    const link = document.createElement("a");
    link.download = zipName + ".zip";
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);

    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-download"></i> Download';
  });

// --- Download Resized ---
document
  .getElementById("downloadResizedBtn")
  .addEventListener("click", async () => {
    if (!images.length) return;
    const btn = document.getElementById("downloadResizedBtn");
    const zipInput = document.getElementById("zipFilename");
    let zipName = zipInput.value.trim() || "resized_images";
    zipName = zipName.replace(/\.zip$/i, "");

    btn.disabled = true;
    btn.innerHTML =
      '<span class="spinner-border spinner-border-sm"></span> Processing...';

    const zip = new JSZip();
    images.forEach((item) => {
      const c = document.createElement("canvas");
      const ctx = c.getContext("2d");
      c.width = item.img.width;
      c.height = item.img.height;
      ctx.drawImage(item.img, 0, 0, c.width, c.height);
      const dataUrl = c.toDataURL("image/png").split(",")[1];
      zip.file(
        "resized_" + item.file.name.replace(/\.[^.]+$/, "") + ".png",
        dataUrl,
        { base64: true },
      );
    });

    const blob = await zip.generateAsync({ type: "blob" });
    const link = document.createElement("a");
    link.download = zipName + ".zip";
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);

    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-download"></i> Download Resized';
  });

// --- Init ---
updateUI();
