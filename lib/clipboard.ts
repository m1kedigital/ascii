/**
 * Reliable text copy — Clipboard API fails for large ASCII on some browsers.
 * Falls back to a temporary textarea + execCommand.
 */
export async function copyTextToClipboard(text: string): Promise<void> {
  const value = text;

  // Prefer async clipboard when available and context is secure
  if (
    typeof navigator !== "undefined" &&
    navigator.clipboard &&
    typeof navigator.clipboard.writeText === "function" &&
    window.isSecureContext
  ) {
    try {
      await navigator.clipboard.writeText(value);
      return;
    } catch {
      // fall through
    }
  }

  // Fallback: selectable textarea
  const ta = document.createElement("textarea");
  ta.value = value;
  ta.setAttribute("readonly", "");
  ta.style.position = "fixed";
  ta.style.top = "0";
  ta.style.left = "0";
  ta.style.width = "2em";
  ta.style.height = "2em";
  ta.style.padding = "0";
  ta.style.border = "none";
  ta.style.outline = "none";
  ta.style.boxShadow = "none";
  ta.style.background = "transparent";
  ta.style.opacity = "0";
  document.body.appendChild(ta);

  ta.focus();
  ta.select();
  ta.setSelectionRange(0, value.length);

  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  document.body.removeChild(ta);

  if (!ok) {
    throw new Error("Copy failed");
  }
}
