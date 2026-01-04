"use client";

import type { RefObject } from "react";
import { useEffect, useRef, useState } from "react";

import { ScrollAssistRoot, ScrollDot, ScrollDots, ScrollTopButton } from "./ScrollAssist.styles";

type ScrollAssistProps = {
  rootRef: RefObject<HTMLElement | null>;
};

type SectionMetrics = {
  tops: number[];
  heights: number[];
  topThreshold: number;
  count: number;
  scrollable: boolean;
};

const emptyMetrics: SectionMetrics = {
  tops: [],
  heights: [],
  topThreshold: 0,
  count: 0,
  scrollable: false,
};

export function ScrollAssist({ rootRef }: ScrollAssistProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [showTop, setShowTop] = useState(false);
  const [sectionCount, setSectionCount] = useState(0);
  const [scrollable, setScrollable] = useState(false);
  const metricsRef = useRef<SectionMetrics>(emptyMetrics);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    let raf = 0;
    let resizeObserver: ResizeObserver | null = null;

    const getSections = () =>
      Array.from(root.querySelectorAll<HTMLElement>("[data-section]"));

    const compute = () => {
      const nodes = getSections();
      const tops: number[] = [];
      const heights: number[] = [];

      nodes.forEach((node) => {
        const rect = node.getBoundingClientRect();
        const height = rect.height;
        if (height <= 0) return;
        const top = window.scrollY + rect.top;
        tops.push(top);
        heights.push(height);
      });

      const doc = document.documentElement;
      const scrollableNow = doc.scrollHeight - window.innerHeight > 4;
      const firstHeight = heights[0] ?? window.innerHeight;

      metricsRef.current = {
        tops,
        heights,
        topThreshold: firstHeight * 0.5,
        count: nodes.length,
        scrollable: scrollableNow,
      };

      setSectionCount(nodes.length);
      setScrollable(scrollableNow);
      update();
    };

    const update = () => {
      const { tops, topThreshold, count } = metricsRef.current;
      const scrollTop = window.scrollY;
      const mid = scrollTop + window.innerHeight * 0.5;

      setShowTop(scrollTop > topThreshold);

      if (count <= 1 || tops.length === 0) {
        setActiveIndex(0);
        return;
      }

      let nextIndex = 0;
      for (let i = 0; i < tops.length; i += 1) {
        if (mid >= tops[i]) nextIndex = i;
      }
      setActiveIndex(nextIndex);
    };

    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        update();
      });
    };

    const onResize = () => {
      compute();
    };

    compute();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);

    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => compute());
      getSections().forEach((node) => resizeObserver?.observe(node));
    }

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      if (raf) window.cancelAnimationFrame(raf);
      resizeObserver?.disconnect();
    };
  }, [rootRef]);

  const showIndicator = scrollable && sectionCount > 1;

  return (
    <>
      {showIndicator && (
        <ScrollAssistRoot aria-hidden="true">
          <ScrollDots>
            {Array.from({ length: sectionCount }).map((_, index) => (
              <ScrollDot key={`scroll-dot-${index}`} active={index === activeIndex} />
            ))}
          </ScrollDots>
        </ScrollAssistRoot>
      )}

      <ScrollTopButton
        type="button"
        visible={showTop}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Back to top"
      >
        Top
      </ScrollTopButton>
    </>
  );
}
