"use client";
import { useEffect, useRef } from "react";
import { z, ZodError } from "zod";
import { ParallaxImg, ParallaxImgContainer } from "./styles";

type Props = {
  src: string;
  alt: string;
  speed?: number; // 0..1
  maxShift?: number; // px clamp
  mouseFollowStrength?: number; // 0..1 for mouse follow intensity
};

const propsSchema = z.object({
  src: z.string(),
  alt: z.string(),
  speed: z.number().min(0).max(1).optional(),
  maxShift: z.number().min(0).optional(),
  mouseFollowStrength: z.number().min(0).max(1).optional(),
});

const EASING_FACTOR = 0.12;

export default function ParallaxImage(props: Props) {
  try {
    propsSchema.parse(props);
  } catch (e) {
    if (e instanceof ZodError) {
      console.warn("ParallaxImage: Invalid props -", e.message);
    } else {
      console.warn("ParallaxImage: Unexpected error during prop validation");
    }
  }

  const { src, alt, speed = 0.5, maxShift = 160, mouseFollowStrength = 0.5 } = props;
  const ref = useRef<HTMLImageElement | null>(null);
  const yRef = useRef(0);
  const xRef = useRef(0);
  const mouseXRef = useRef(0);
  const mouseYRef = useRef(0);
  const raf = useRef<number | null>(null);
  const visible = useRef(false);

  useEffect(() => {
    const img = ref.current;
    if (!img) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const stickyContainer = img.closest("main") as HTMLElement | null;
    if (!stickyContainer) {
      console.warn(
        "ParallaxImage: No parent <main> found. Put this inside a <main> element for parallax to work.",
      );
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      // Convert mouse position to -1..1 range (center is 0,0)
      // Reverse the direction by negating
      mouseXRef.current = -((e.clientX / window.innerWidth) * 2 - 1);
      mouseYRef.current = -((e.clientY / window.innerHeight) * 2 - 1);
    };

    const start = () => {
      if (raf.current == null) raf.current = requestAnimationFrame(tick);
    };

    const stop = () => {
      if (raf.current != null) cancelAnimationFrame(raf.current);
      raf.current = null;
    };

    const tick = () => {
      if (!visible.current) {
        stop();
        return;
      }

      // Scroll-based parallax
      const rect = stickyContainer.getBoundingClientRect();
      const progress =
        (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
      const clamped = Math.max(0, Math.min(1, progress));
      const scrollTarget = (clamped - 0.5) * 2 * maxShift * speed;

      // Mouse-based parallax (reverse direction)
      const mouseXTarget = mouseXRef.current * maxShift * mouseFollowStrength;
      const mouseYTarget = mouseYRef.current * maxShift * mouseFollowStrength;

      // Combine scroll and mouse movement
      const targetY = scrollTarget + mouseYTarget;
      const targetX = mouseXTarget;

      // Smooth easing
      yRef.current += (targetY - yRef.current) * EASING_FACTOR;
      xRef.current += (targetX - xRef.current) * EASING_FACTOR;

      img.style.transform = `translate3d(${xRef.current.toFixed(2)}px, ${yRef.current.toFixed(2)}px, 0)`;

      raf.current = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.length > 0) {
          visible.current = !!entries[0].isIntersecting;
          if (visible.current) start();
          else stop();
        }
      },
      { root: null, threshold: 0 },
    );
    io.observe(img);

    window.addEventListener("mousemove", handleMouseMove);
    start();

    return () => {
      stop();
      io.disconnect();
      window.removeEventListener("mousemove", handleMouseMove);
      if (img) img.style.transform = "";
    };
  }, [speed, maxShift, mouseFollowStrength]);

  return (
    <ParallaxImgContainer>
      <ParallaxImg
        ref={ref}
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 800px) 80vw, 560px"
        style={{ objectFit: "contain" }}
        fetchPriority={"high"}
        priority
      />
    </ParallaxImgContainer>
  );
}
