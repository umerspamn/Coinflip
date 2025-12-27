window.onerror = (msg, src, line, col) => {
  alert(`ERR: ${msg}\n${src}:${line}:${col}`);
};

window.onunhandledrejection = (e) => {
  alert(`PROMISE ERR: ${e.reason?.message || e.reason}`);
};

(async () => {
  alert("booting app...");

  // Instances (from your firebase.js)
  const { auth, db } = await import("./firebase.js");

  // SDK funcs (only if you DID NOT re-export them in firebase.js)
  const { onAuthStateChanged, signInAnonymously, setPersistence, browserLocalPersistence } =
    await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js");
  const { ref, onValue } =
    await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js");

  // App modules
  const { ui, showGameScreen } = await import("./ui.js");
  const { toast } = await import("./toast.js");
  const { log, copyRoomLink } = await import("./utils.js");
  const { joinRoomAndListen } = await import("./room.js");

  // ---- app state ----
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

  // ✅ 핵심: ENTER 버튼이 "게임 시작"을 직접 실행하게 만들기 (auth 콜백 타이밍 의존 제거)
  async function startGameAfterEnter() {
    if (!auth.currentUser) {
      // Optional but recommended: reduce new-anon spam & make auth more stable
      try {
        await setPersistence(auth, browserLocalPersistence);
      } catch (_) {
        // ignore; some environments may not support it cleanly
      }

      await signInAnonymously(auth);
      log("sign-in success", auth.currentUser?.uid);
    } else {
      log("already signed-in", auth.currentUser.uid);
    }

    currentUser = auth.currentUser;
    if (!currentUser) throw new Error("Auth user missing after sign-in");

    showGameScreen();

    await joinRoomAndListen({ currentUser, myName, setCurrentRoomId });

    // Flip button only enabled after prediction
    ui.btns.flip.disabled = !localState.prediction;
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
      await startGameAfterEnter();
      ui.btns.enter.disabled = false;
      ui.btns.enter.innerText = "ENTER ROOM";
    } catch (e) {
      console.error(e);
      ui.btns.enter.disabled = false;
      ui.btns.enter.innerText = "ENTER ROOM";
      toast("Connect failed: " + (e?.message || e), "error");
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

    // Placeholders
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

    // ✅ auth listener now ONLY updates state (no UI gating / no timing dependence)
    onAuthStateChanged(auth, (user) => {
      log("auth state", user ? user.uid : "no user");
      currentUser = user || null;

      // If user signed out for any reason, unblock button
      if (!currentUser) {
        ui.btns.enter.disabled = false;
        ui.btns.enter.innerText = "ENTER ROOM";
      }
    });

    log("init done");
  }

  init();
})();