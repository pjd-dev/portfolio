// useScrollbar.ts
import { RefObject, useCallback, useEffect, useState } from "react";

export function useFormScrollbar(ref: RefObject<HTMLDivElement | null>) {
  const [visible, setVisible] = useState(false);
  const [sizePct, setSizePct] = useState(1);
  const [offsetPct, setOffsetPct] = useState(0);

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;

    const { scrollTop, scrollHeight, clientHeight } = el;

    const scrollable = scrollHeight - clientHeight;
    if (scrollable <= 0) {
      // no scroll → hide pill
      setVisible(false);
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

    setVisible(true);
    setSizePct(thumbRatio);
    setOffsetPct(offsetRatio);
  }, [ref]);

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

  return { visible, sizePct, offsetPct };
}
