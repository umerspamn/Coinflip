export const ui = {
  screens: {
    start: document.getElementById("screenStart"),
    game: document.getElementById("screenGame"),
  },
  inputs: {
    name: document.getElementById("inpName"),
    dare: document.getElementById("inpDare"),
  },
  btns: {
    enter: document.getElementById("btnEnter"),
    flip: document.getElementById("btnFlip"),
    reset: document.getElementById("btnReset"),
    copy1: document.getElementById("btnCopyLink"),
    copy2: document.getElementById("btnCopyBtm"),
    predH: document.getElementById("btnPredH"),
    predT: document.getElementById("btnPredT"),
    sendDare: document.getElementById("btnSendDare"),
    doneDare: document.getElementById("btnDoneDare"),
  },
  disp: {
    code: document.getElementById("dispCode"),
    list: document.getElementById("listPlayers"),
    count: document.getElementById("dispCount"),
    coin: document.getElementById("elCoin"),
    result: document.getElementById("dispResult"),
    turn: document.getElementById("dispTurn"),
    elig: document.getElementById("dispEligible"),
    dot: document.getElementById("statusDot"),
  },
  overlay: {
    el: document.getElementById("overlayDare"),
    text: document.getElementById("overlayText"),
    from: document.getElementById("overlayFrom"),
  },
  toastBox: document.getElementById("toastBox"),
};

export function showGameScreen() {
  ui.screens.start.classList.remove("active");
  ui.screens.start.classList.add("hidden");
  ui.screens.game.classList.remove("hidden");
  ui.screens.game.classList.add("active");
}