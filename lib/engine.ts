export function flagEngine() {
  if (typeof window === "undefined") return;
  const ua = navigator.userAgent;
  const isFirefox = "InstallTrigger" in window;
  const isEdge = ua.includes("Edg/");
  const isChromeLike = "chrome" in window && !isEdge;
  const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
  const engine = isFirefox
    ? "gecko"
    : isSafari
      ? "webkit"
      : isEdge || isChromeLike
        ? "blink"
        : "unknown";

  const cq = CSS.supports("font-size", "1cqw") ? "yes" : "no";
  const root = document.documentElement;
  root.dataset.engine = engine;
  root.dataset.cq = cq;
}
