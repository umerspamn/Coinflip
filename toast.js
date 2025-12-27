import { ui } from "./ui.js";

export function toast(msg, type = "success") {
  const box = ui.toastBox;
  if (!box) return alert(msg);

  const t = document.createElement("div");
  t.className = `toast ${type === "error" ? "error" : "success"}`;
  t.textContent = msg;
  box.appendChild(t);

  setTimeout(() => {
    t.style.animation = "fadeOut 0.35s ease forwards";
    setTimeout(() => t.remove(), 380);
  }, 2200);
}