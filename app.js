window.onerror = (msg, src, line, col) => {
  alert(`ERR: ${msg}\n${src}:${line}:${col}`);
};

window.onunhandledrejection = (e) => {
  alert(`PROMISE ERR: ${e.reason?.message || e.reason}`);
};

(async () => {
  alert("booting app...");

  // Instances
  const { auth, db } = await import("./firebase.js");

  // SDK funcs
  const { onAuthStateChanged, signInAnonymously } = await import(
    "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js"
  );
  const { ref, onValue } = await import(
    "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js"
  );

  // App modules
  const { ui, showGameScreen } = await import("./ui.js");
  const { toast } = await import("./toast.js");
  const { log, copyRoomLink } = await import("./utils.js");
  const { joinRoomAndListen } = await import("./room.js");

  // ---- your app code starts here ----
  let currentUser = null;
  let myName = "";
  let currentRoomId = null;
  const localState = { prediction: null };

  function setCurrentRoomId(v) { currentRoomId = v; }

  function setupConnectionStatus() {
    onValue(ref(db, ".info/connected"), (snap) => {
      ui.disp.dot.style.background = snap.val() ? "var(--secondary)" : "var(--error)";
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
    if (!ui.btns.enter) throw new Error("btnEnter not found. Fix ui.js IDs.");
    ui.btns.enter.addEventListener("click", handleEnter);

    ui.btns.copy1.addEventListener("click", () => copyRoomLink(currentRoomId));
    ui.btns.copy2.addEventListener("click", () => copyRoomLink(currentRoomId));

    ui.btns.reset.addEventListener("click", handleReset);
    ui.btns.predH.addEventListener("click", () => makePred("HEADS"));
    ui.btns.predT.addEventListener("click", () => makePred("TAILS"));

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

  init();
})();