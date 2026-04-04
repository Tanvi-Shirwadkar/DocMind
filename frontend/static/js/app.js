// DocMind — Frontend

const API = ""; // same origin — FastAPI serves frontend

// ── State ──
let currentDoc = null;

// ── Background canvas
(function () {
  var width,
    height,
    largeHeader,
    canvas,
    ctx,
    points,
    target,
    animateHeader = true;

  // Main
  initHeader();
  initAnimation();
  addListeners();

  function initHeader() {
    width = window.innerWidth;
    height = window.innerHeight;
    target = { x: width / 2, y: height / 2 };

    largeHeader = document.getElementById("large-header");
    largeHeader.style.height = height + "px";

    canvas = document.getElementById("demo-canvas");
    canvas.width = width;
    canvas.height = height;
    ctx = canvas.getContext("2d");

    points = [];
    for (var x = 0; x < width; x = x + width / 20) {
      for (var y = 0; y < height; y = y + height / 20) {
        var px = x + (Math.random() * width) / 20;
        var py = y + (Math.random() * height) / 20;
        var p = { x: px, originX: px, y: py, originY: py };
        points.push(p);
      }
    }

    // for each point finding the 5 closest points
    for (var i = 0; i < points.length; i++) {
      var closest = [];
      var p1 = points[i];
      for (var j = 0; j < points.length; j++) {
        var p2 = points[j];
        if (!(p1 == p2)) {
          var placed = false;
          for (var k = 0; k < 5; k++) {
            if (!placed) {
              if (closest[k] == undefined) {
                closest[k] = p2;
                placed = true;
              }
            }
          }

          for (var k = 0; k < 5; k++) {
            if (!placed) {
              if (getDistance(p1, p2) < getDistance(p1, closest[k])) {
                closest[k] = p2;
                placed = true;
              }
            }
          }
        }
      }
      p1.closest = closest;
    }

    // assigning a circle to each point
    for (var i in points) {
      var c = new Circle(
        points[i],
        2 + Math.random() * 2,
        "rgba(255,255,255,0.3)",
      );
      points[i].circle = c;
    }
  }

  // Event handling
  function addListeners() {
    if (!("ontouchstart" in window)) {
      window.addEventListener("mousemove", mouseMove);
    }
    window.addEventListener("scroll", scrollCheck);
    window.addEventListener("resize", resize);
  }

  function mouseMove(e) {
    var posx = (posy = 0);
    if (e.pageX || e.pageY) {
      posx = e.pageX;
      posy = e.pageY;
    } else if (e.clientX || e.clientY) {
      posx =
        e.clientX +
        document.body.scrollLeft +
        document.documentElement.scrollLeft;
      posy =
        e.clientY +
        document.body.scrollTop +
        document.documentElement.scrollTop;
    }
    target.x = posx;
    target.y = posy;
  }

  function scrollCheck() {
    if (document.body.scrollTop > height) animateHeader = false;
    else animateHeader = true;
  }

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    largeHeader.style.height = height + "px";
    canvas.width = width;
    canvas.height = height;
  }

  // animation
  function initAnimation() {
    animate();
    for (var i in points) {
      shiftPoint(points[i]);
    }
  }

  function animate() {
    if (animateHeader) {
      ctx.clearRect(0, 0, width, height);
      for (var i in points) {
        // detect points in range
        if (Math.abs(getDistance(target, points[i])) < 4000) {
          points[i].active = 0.3;
          points[i].circle.active = 0.6;
        } else if (Math.abs(getDistance(target, points[i])) < 20000) {
          points[i].active = 0.1;
          points[i].circle.active = 0.3;
        } else if (Math.abs(getDistance(target, points[i])) < 40000) {
          points[i].active = 0.02;
          points[i].circle.active = 0.1;
        } else {
          points[i].active = 0;
          points[i].circle.active = 0;
        }

        drawLines(points[i]);
        points[i].circle.draw();
      }
    }
    requestAnimationFrame(animate);
  }

  function shiftPoint(p) {
    TweenLite.to(p, 1 + 1 * Math.random(), {
      x: p.originX - 50 + Math.random() * 100,
      y: p.originY - 50 + Math.random() * 100,
      ease: Circ.easeInOut,
      onComplete: function () {
        shiftPoint(p);
      },
    });
  }

  // Canvas manipulation
  function drawLines(p) {
    if (!p.active) return;
    for (var i in p.closest) {
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.closest[i].x, p.closest[i].y);
      ctx.strokeStyle = "rgba(200,241,53," + p.active + ")";
      ctx.stroke();
    }
  }

  function Circle(pos, rad, color) {
    var _this = this;

    // constructor
    (function () {
      _this.pos = pos || null;
      _this.radius = rad || null;
      _this.color = color || null;
    })();

    this.draw = function () {
      if (!_this.active) return;
      ctx.beginPath();
      ctx.arc(_this.pos.x, _this.pos.y, _this.radius, 0, 2 * Math.PI, false);
      ctx.fillStyle = "rgba(200,241,53," + _this.active + ")";
      ctx.fill();
    };
  }

  // Util
  function getDistance(p1, p2) {
    return Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2);
  }
})();

// ── View switching ──
function showView(id) {
  document.querySelectorAll(".view").forEach((v) => {
    v.classList.remove("active");
  });

  document.getElementById(id).classList.add("active");

  const bg = document.getElementById("large-header");

  if (id === "landing") {
    bg.classList.remove("hidden"); // fade IN
  } else {
    bg.classList.add("hidden"); // fade OUT
  }
}

// ── File upload  ──
const uploadZone = document.getElementById("uploadZone");
const fileInput = document.getElementById("fileInput");

uploadZone.addEventListener("click", (e) => {
  fileInput.click();
});

// FILE SELECT
fileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) handleFile(file);
});

// DRAG EVENTS
uploadZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  uploadZone.classList.add("drag-active");
});

uploadZone.addEventListener("dragleave", () => {
  uploadZone.classList.remove("drag-active");
});

uploadZone.addEventListener("drop", (e) => {
  e.preventDefault();
  uploadZone.classList.remove("drag-active");

  const file = e.dataTransfer.files[0];
  if (file) handleFile(file);
});

// ── MAIN FILE HANDLER ──
async function handleFile(file) {
  showView("processing");

  // Show filename
  document.querySelector(".upload-text strong").innerText = file.name;
  document.querySelector(".upload-text span").innerText = "Uploading...";

  const steps = ["ps-extract", "ps-chunk", "ps-embed", "ps-faiss"];
  const labels = [
    "Extracting text…",
    "Chunking document…",
    "Generating embeddings…",
    "Building FAISS index…",
  ];

  let stepIdx = 0;

  function advanceStep() {
    if (stepIdx > 0)
      document.getElementById(steps[stepIdx - 1]).className = "proc-step done";

    if (stepIdx < steps.length) {
      const prev = document.getElementById(steps[stepIdx - 1]);
      if (prev) prev.className = "proc-step done";

      const current = document.getElementById(steps[stepIdx]);
      if (current) {
         current.className = "proc-step active";
       }

      const label = document.getElementById("procLabel");
        if (label) {
          label.textContent = labels[stepIdx];
       }
      document.getElementById("procLabel").textContent = labels[stepIdx];
      stepIdx++;
    }
  }

  advanceStep();

  const formData = new FormData();
  formData.append("file", file);

  try {
    for (const delay of [600, 1200, 800]) {
      await sleep(delay);
      advanceStep();
    }

    const res = await fetch(`${API}/api/upload`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Upload failed");

    // marking all steps done
    steps.forEach((s) => {
     const el = document.getElementById(s);
     if (el) el.className = "proc-step done";
    });
    

    await sleep(500);

    currentDoc = data;
    enterApp(data);
  } catch (err) {
    showView("landing");
    alert("Error: " + err.message);
  }
}

function enterApp(meta) {
  document.getElementById("docBadge").textContent = meta.filename;
  document.getElementById("chunkCount").textContent = `${meta.chunks} chunks`;
  document.getElementById("tokenCount").textContent =
    `~${meta.tokens_est} tokens`;
  document.getElementById("totalChunks").textContent = `${meta.chunks} total`;
  document.getElementById("wmSub").textContent =
    `${meta.chunks} chunks indexed from "${meta.filename}"`;

  // Reset messages
  document.getElementById("messages").innerHTML = `
    <div class="welcome-msg">
      <div class="wm-title">Indexed <span class="wm-check">✓</span></div>
      <div class="wm-sub">${meta.chunks} chunks · ${meta.words.toLocaleString()} words · Ask anything</div>
    </div>`;

  renderAllChunks(meta.chunks);
  resetPipeline();
  showView("app");
}

function renderAllChunks(total) {
  const scroll = document.getElementById("chunkScroll");
  scroll.innerHTML = `<div class="chunk-empty">Run a query to see which chunks FAISS retrieves</div>`;
}

function resetApp() {
  currentDoc = null;
  fileInput.value = "";
  showView("landing");
}

// ── Pipeline UI ──
const pipeNodes = [
  "rp-query",
  "rp-search",
  "rp-context",
  "rp-llm",
  "rp-answer",
];

function resetPipeline() {
  pipeNodes.forEach((id) => {
    const el = document.getElementById(id);
    el.classList.remove("active", "done");
  });
}

async function animatePipeline() {
  resetPipeline();
  for (let i = 0; i < pipeNodes.length; i++) {
    const el = document.getElementById(pipeNodes[i]);
    if (i > 0)
      document
        .getElementById(pipeNodes[i - 1])
        .classList.replace("active", "done");
    el.classList.add("active");
    await sleep(350);
  }
}

function completePipeline() {
  pipeNodes.forEach((id) => {
    const el = document.getElementById(id);
    el.classList.remove("active");
    el.classList.add("done");
  });
  setTimeout(resetPipeline, 3000);
}

// ── Query ──
const queryInput = document.getElementById("queryInput");
const sendBtn = document.getElementById("sendBtn");

queryInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendQuery();
  }
});

// Auto-resize textarea
queryInput.addEventListener("input", () => {
  queryInput.style.height = "auto";
  queryInput.style.height = Math.min(queryInput.scrollHeight, 140) + "px";
});

async function sendQuery() {
  const q = queryInput.value.trim();
  if (!q || sendBtn.disabled) return;

  queryInput.value = "";
  queryInput.style.height = "";
  sendBtn.disabled = true;

  addMessage("user", q);
  const loadId = addLoading();

  // Running pipeline animation concurrently
  const pipePromise = animatePipeline();

  try {
    const res = await fetch(`${API}/api/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: q, top_k: 5 }),
    });
    const data = await res.json();

    await pipePromise;
    removeLoading(loadId);
    completePipeline();

    if (!res.ok) throw new Error(data.detail || "Query failed");

    addMessage("ai", data.answer, data.sources);
    renderHitChunks(data.sources);
  } catch (err) {
    await pipePromise;
    removeLoading(loadId);
    completePipeline();
    addMessage("ai", `Error: ${err.message}`);
  }

  sendBtn.disabled = false;
}

// ── Messages ──
function addMessage(role, text, sources = []) {
  const msgs = document.getElementById("messages");
  const div = document.createElement("div");
  div.className = `msg ${role}`;

  const avatar = role === "user" ? "U" : "⬡";
  const formatted = formatText(text);

  let sourcesHtml = "";
  if (sources.length) {
    const pills = sources
      .map(
        (s, i) =>
          `<span
        class="source-pill ${i < 2 ? "top" : ""}"
        data-chunk="${s.chunk_id}"
      >
        📄 chunk_${String(s.chunk_id).padStart(3, "0")} · ${(s.score * 100).toFixed(0)}%
      </span>`,
      )
      .join("");
    sourcesHtml = `<div class="msg-sources">${pills}</div>`;
  }

  div.innerHTML = `
    <div class="msg-avatar">${avatar}</div>
    <div class="msg-body">
      <div class="msg-bubble">${formatted}</div>
      ${sourcesHtml}
    </div>`;

  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

let loadCounter = 0;
function addLoading() {
  const msgs = document.getElementById("messages");
  const id = "load-" + ++loadCounter;
  const div = document.createElement("div");
  div.className = "msg ai";
  div.id = id;
  div.innerHTML = `
    <div class="msg-avatar">⬡</div>
    <div class="msg-body">
      <div class="msg-bubble loading-bubble">
        <div class="ldots"><span></span><span></span><span></span></div>
      </div>
    </div>`;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
  return id;
}

function removeLoading(id) {
  document.getElementById(id)?.remove();
}

function formatText(text) {
  return text
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .split("\n\n")
    .map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`)
    .join("");
}

// ── Chunk sidebar hits ──
function renderHitChunks(sources) {
  const scroll = document.getElementById("chunkScroll");
  if (!sources || !sources.length) return;

  scroll.innerHTML = sources
    .map((s, i) => {
      const delay = i * 60;

      console.log("Chunk IDs:", s.chunk_id);

      return `
      <div class="chunk-card hit" id="chunk-${String(s.chunk_id).padStart(3, "0")}" style="animation-delay:${delay}ms">
        <div class="chunk-head">
          <span class="chunk-id">CHUNK_${String(s.chunk_id).padStart(3, "0")}</span>
          <span class="chunk-score">${(s.score * 100).toFixed(0)}%</span>
        </div>
        <div class="chunk-preview">${escHtml(s.text)}</div>
      </div>`;
    })
    .join("");
}

// ── Utils ──
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
function escHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

document.addEventListener("DOMContentLoaded", () => {
  document.addEventListener("click", (e) => {
    //SOURCE PILLS
    const source = e.target.closest(".source-pill");
    if (source) {
      const id = source.dataset.chunk;
      scrollToChunk(id);
      return;
    }

    //SUGGESTION PILLS
    const suggest = e.target.closest(".suggest-pill");
    if (suggest) {
      const text = suggest.innerText;
      queryInput.value = text;
      sendQuery();
      document.querySelector(".suggestions")?.remove();
      return;
    }
  });
});

window.scrollToChunk = function (chunkId) {
  const padded = String(chunkId).padStart(3, "0");

  // find ANY matching chunk in DOM
  const el = document.querySelector(`[id="chunk-${padded}"]`);
  const container = document.getElementById("chunkScroll");

  if (!el || !container) {
    console.log("Chunk not in current view:", chunkId);
    return;
  }

  container.scrollTo({
    top: el.offsetTop - container.offsetTop - container.clientHeight / 2,
    behavior: "smooth",
  });

  el.classList.add("highlight");

  setTimeout(() => {
    el.classList.remove("highlight");
  }, 2000);
};
