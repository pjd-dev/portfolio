import { RefObject, useCallback, useEffect, useState } from "react";

export function useScroll(ref: RefObject<HTMLDivElement | null>) {
  const [showThumb, setShowThumb] = useState(false);
  const [canScroll, setCanScroll] = useState(false);
  const [haveScroll, setHaveScroll] = useState(false);

  const [showBar, setShowBar] = useState(false);
  const [sizePct, setSizePct] = useState(1);
  const [offsetPct, setOffsetPct] = useState(0);

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;

    const { scrollTop, scrollHeight, clientHeight } = el;

    const scrollable = scrollHeight - clientHeight;
    const scrollableNow = scrollable > 0;

    if (scrollableNow !== canScroll) {
      setCanScroll(scrollableNow);
    }
    if (!scrollableNow) {
      // no scroll → hide pill
      setShowBar(false);
      setHaveScroll(false);
      setShowThumb(false);
      setSizePct(1);
      setOffsetPct(0);
      return;
    }

    // how much of the content is visible
    const visibleRatio = clientHeight / scrollHeight;

    // thumb is at least 1/3 of the track
    const MIN_RATIO = 1 / 3;
    const thumbRatio = Math.max(visibleRatio, MIN_RATIO); // 0 < thumbRatio ≤ 1

    // base scroll progress in [0, 1]
    let scrollProgress = scrollTop / scrollable;

    // if we're within 1px of the bottom, snap to 1
    const EPS = 1; // px tolerance
    const distanceToBottom = scrollable - scrollTop;
    if (distanceToBottom <= EPS) {
      scrollProgress = 1;
    }

    // clamp just in case
    scrollProgress = Math.min(Math.max(scrollProgress, 0), 1);

    // actual offset inside track: 0 → (1 - thumbRatio)
    const maxOffset = 1 - thumbRatio;
    const offsetRatio = scrollProgress * maxOffset;

    setHaveScroll(scrollTop > 8);
    setShowThumb(true);
    setShowBar(true);
    setSizePct(thumbRatio);
    setOffsetPct(offsetRatio);
  }, [ref, canScroll]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    update();

    const onScroll = () => update();
    const onResize = () => update();

    el.addEventListener("scroll", onScroll);
    window.addEventListener("resize", onResize);

    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [ref, update]);

  return { showBar, sizePct, offsetPct, canScroll, showThumb, haveScroll };
}
