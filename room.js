import { db, ref, set, onValue, serverTimestamp, onDisconnect } from "./firebase.js";
import { ui } from "./ui.js";
import { log, getOrCreateRoomCode } from "./utils.js";

export async function joinRoomAndListen({ currentUser, myName, setCurrentRoomId }) {
  const code = getOrCreateRoomCode();
  setCurrentRoomId(code);
  ui.disp.code.textContent = code;
  log("room code", code);

  const meRef = ref(db, `rooms/${code}/players/${currentUser.uid}`);
  await set(meRef, {
    nick: myName,
    joinedAt: serverTimestamp(),
    uid: currentUser.uid
  });
  log("presence set", currentUser.uid);

  onDisconnect(meRef).remove();

  const playersRef = ref(db, `rooms/${code}/players`);
  onValue(playersRef, (snap) => {
    renderPlayers(snap.val() || {}, currentUser.uid);
    ui.disp.turn.textContent = `Connected as ${myName}. Share LINK to invite.`;
    log("players updated");
  });

  return code;
}

function renderPlayers(playersObj, myUid) {
  const entries = Object.values(playersObj || {});
  ui.disp.count.textContent = String(entries.length);

  ui.disp.list.innerHTML = "";
  entries
    .sort((a, b) => String(a.nick || "").localeCompare(String(b.nick || "")))
    .forEach((p) => {
      const chip = document.createElement("div");
      chip.className = "p-chip";
      chip.textContent = p.nick || "Player";
      if (p.uid === myUid) chip.classList.add("me");
      ui.disp.list.appendChild(chip);
    });
}