import { auth, db, onAuthStateChanged, signInAnonymously, ref, onValue } from "./firebase.js";
import { ui, showGameScreen } from "./ui.js";
import { toast } from "./toast.js";
import { log, copyRoomLink } from "./utils.js";
import { joinRoomAndListen } from "./room.js";

let currentUser = null;
let myName = "";
let currentRoomId = null;

const localState = { prediction: null };

function setCurrentRoomId(v) {
  currentRoomId = v;
}

function setupConnectionStatus() {
  onValue(ref(db, ".info/connected"), (snap) => {
    const ok = !!snap.val();
    ui.disp.dot.style.background = ok ? "var(--secondary)" : "var(--error)";
  });
}

async function handleEnter() {
  log("enter clicked");
  const name = (ui.inputs.name.value || "").trim();
  if (!name) return toast("Please enter a name", "error");

  myName = name;
  localStorage.setItem("cf_name", name);

  ui.btns.enter.disabled = true;
  ui.btns.enter.innerText = "CONNECTING...";

  try {
    await signInAnonymously(auth);
    log("sign-in success", auth.currentUser?.uid);
  } catch (e) {
    console.error(e);
    ui.btns.enter.disabled = false;
    ui.btns.enter.innerText = "ENTER ROOM";
    toast("Login Failed: " + e.message, "error");
  }
}

function makePred(side) {
  localState.prediction = side;
  ui.btns.predH.classList.toggle("selected", side === "HEADS");
  ui.btns.predT.classList.toggle("selected", side === "TAILS");
  ui.btns.flip.disabled = false;
  toast(`Selected ${side}`, "success");
}

function handleReset() {
  localState.prediction = null;
  ui.btns.predH.classList.remove("selected");
  ui.btns.predT.classList.remove("selected");
  ui.btns.flip.disabled = true;
  ui.disp.result.textContent = "WAITING...";
  toast("Reset (local)", "success");
}

function wireUI() {
  ui.btns.enter.addEventListener("click", handleEnter);

  ui.btns.copy1.addEventListener("click", () => copyRoomLink(currentRoomId));
  ui.btns.copy2.addEventListener("click", () => copyRoomLink(currentRoomId));

  ui.btns.reset.addEventListener("click", handleReset);
  ui.btns.predH.addEventListener("click", () => makePred("HEADS"));
  ui.btns.predT.addEventListener("click", () => makePred("TAILS"));

  // Placeholders so buttons don't crash:
  ui.btns.flip.addEventListener("click", () => toast("Flip logic not implemented yet", "error"));
  ui.btns.sendDare.addEventListener("click", () => toast("Dare chat not implemented yet", "error"));
  ui.btns.doneDare.addEventListener("click", () => ui.overlay.el.classList.remove("visible"));
}

function init() {
  log("init");
  const saved = localStorage.getItem("cf_name");
  if (saved) ui.inputs.name.value = saved;

  wireUI();
  setupConnectionStatus();

  onAuthStateChanged(auth, async (user) => {
    log("auth state", user ? user.uid : "no user");
    currentUser = user || null;

    if (!currentUser) {
      ui.btns.enter.disabled = false;
      ui.btns.enter.innerText = "ENTER ROOM";
      return;
    }

    // Only proceed to game if nickname exists (set on ENTER)
    if (!myName) return;

    showGameScreen();
    ui.btns.enter.disabled = false;
    ui.btns.enter.innerText = "ENTER ROOM";

    try {
      await joinRoomAndListen({ currentUser, myName, setCurrentRoomId });
      ui.btns.flip.disabled = !localState.prediction;
    } catch (e) {
      console.error(e);
      toast("Room join failed: " + e.message, "error");
    }
  });

  log("init done");
}
window.onerror = (msg, src, line, col, err) => {
  alert(`ERR: ${msg}\n${src}:${line}:${col}`);
};

window.onunhandledrejection = (e) => {
  alert(`PROMISE ERR: ${e.reason?.message || e.reason}`);
};
init();