// =========== GIF PATHS =============
const GIFS = {
  accepted: chrome.runtime.getURL("icons/noice.gif"),
  partial: chrome.runtime.getURL("icons/question.gif"),
  wrong: chrome.runtime.getURL("icons/hellna.gif"),
};

// =========== CREATE OVERLAY ELEMENT ============
function createOverlay() {
  const div = document.createElement("div");
  div.className = "noice-judge-overlay";
  div.id = "noice-judge-overlay";

  const img = document.createElement("img");
  div.appendChild(img);

  document.body.appendChild(div);
  return div;
}

const overlay = createOverlay();

// =========== SHOW GIF FUNCTION =============
function showGIF(type) {
  const img = overlay.querySelector("img");
  img.src = GIFS[type];
  overlay.classList.add("show");

  clearTimeout(showGIF.timeout);
  showGIF.timeout = setTimeout(() => {
    overlay.classList.remove("show");
  }, 3500); // 3.5 seconds visible
}

// =========== NORMALIZE TEXT FUNCTION ============
function normalize(text) {
  return String(text || "")
    .trim()
    .toLowerCase();
}

// =========== LEETCODE DETECTOR ============
// =========== LEETCODE NETWORK DETECTOR =============
function hookLeetCodeNetwork() {
  const origFetch = window.fetch;

  window.fetch = async function (...args) {
    const response = await origFetch.apply(this, args);

    const url = args[0];

    if (
      typeof url === "string" &&
      url.includes("/submissions/detail/") &&
      url.includes("/check/")
    ) {
      response
        .clone()
        .json()
        .then((data) => {
          let state = (data.state || "").toLowerCase();
          let status = (data.status_msg || "").toLowerCase();

          if (state === "success" || status.includes("accepted")) {
            showGIF("accepted");
          } else if (status.includes("wrong")) {
            showGIF("wrong");
          } else if (
            status.includes("runtime") ||
            status.includes("time limit")
          ) {
            showGIF("wrong");
          } else if (status.includes("testcase")) {
            showGIF("partial");
          }
        });
    }

    return response;
  };
}

// =========== CODEFORCES DETECTOR ============
function detectCodeforces() {
  const selectors = [
    ".verdict-accepted",
    ".verdict-wrong-answer",
    ".submissionVerdict",
  ];

  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (!el) continue;

    const t = normalize(el.textContent);

    if (t.includes("accepted")) return "accepted";
    if (t.includes("wrong")) return "wrong";
    if (t.includes("passed")) return "partial";
  }

  return null;
}

// =========== START OBSERVERS ============
function startObserver(detectFn) {
  let last = null;

  const observer = new MutationObserver(() => {
    const result = detectFn();
    if (result && result !== last) {
      last = result;
      showGIF(result);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
  });
}

// =========== SELECT SITE AND RUN ============
// if (location.hostname.includes("leetcode.com")) {
//   startObserver(detectLeetCode);
// }
if (location.hostname.includes("leetcode.com")) {
  hookLeetCodeNetwork();
}

if (location.hostname.includes("codeforces.com")) {
  startObserver(detectCodeforces);
}
