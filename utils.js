import { toast } from "./toast.js";

export function log(...a) {
  console.log("[CF]", ...a);
}

export function getOrCreateRoomCode() {
  const url = new URL(window.location.href);
  let code = (url.searchParams.get("room") || "").trim().toUpperCase();

  if (!code) {
    const arr = new Uint8Array(3);
    crypto.getRandomValues(arr);
    code = Array.from(arr).map(b => b.toString(16).padStart(2, "0")).join("").toUpperCase();
  } else {
    code = code.replace(/[^0-9A-F]/g, "").slice(0, 6);
    if (code.length < 6) code = code.padEnd(6, "0");
  }

  url.searchParams.set("room", code);
  window.history.replaceState({}, "", url);
  return code;
}

export function roomLink(currentRoomId) {
  const url = new URL(window.location.href);
  if (currentRoomId) url.searchParams.set("room", currentRoomId);
  return url.toString();
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try {
      const ok = document.execCommand("copy");
      ta.remove();
      return ok;
    } catch {
      ta.remove();
      return false;
    }
  }
}

export async function copyRoomLink(currentRoomId) {
  const ok = await copyText(roomLink(currentRoomId));
  toast(ok ? "Room link copied" : "Copy failed", ok ? "success" : "error");
}