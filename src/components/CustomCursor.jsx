import { useEffect, useRef } from "react";

const INTERACTIVE_SELECTOR = [
  "a",
  "button",
  "input",
  "textarea",
  "select",
  "label",
  "summary",
  "[role='button']",
  ".student-page-nav-pill",
  ".user-nav-pill",
  ".admin-nav-pill",
  ".home-btn"
].join(",");

export default function CustomCursor() {
  const rootRef = useRef(null);
  const dotRef = useRef(null);
  const ringRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    const dot = dotRef.current;
    const ring = ringRef.current;

    if (!root || !dot || !ring) {
      return undefined;
    }

    const canUseCursor =
      window.matchMedia("(pointer: fine)").matches &&
      !window.matchMedia("(hover: none)").matches &&
      document.documentElement.getAttribute("data-motion") !== "reduced";

    if (!canUseCursor) {
      document.documentElement.setAttribute("data-cursor", "default");
      return undefined;
    }

    document.documentElement.setAttribute("data-cursor", "custom");

    let rafId = 0;
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let ringX = mouseX;
    let ringY = mouseY;

    const update = () => {
      ringX += (mouseX - ringX) * 0.2;
      ringY += (mouseY - ringY) * 0.2;

      dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
      ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;

      rafId = window.requestAnimationFrame(update);
    };

    const onMove = (event) => {
      mouseX = event.clientX;
      mouseY = event.clientY;
      root.classList.add("is-visible");
    };

    const onMouseDown = () => root.classList.add("is-down");
    const onMouseUp = () => root.classList.remove("is-down");

    const onOver = (event) => {
      if (event.target instanceof Element && event.target.closest(INTERACTIVE_SELECTOR)) {
        root.classList.add("is-hover");
      }
    };

    const onOut = (event) => {
      if (event.target instanceof Element && event.target.closest(INTERACTIVE_SELECTOR)) {
        root.classList.remove("is-hover");
      }
    };

    const onLeaveViewport = () => root.classList.remove("is-visible");
    const onEnterViewport = () => root.classList.add("is-visible");

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("mouseout", onOut);
    window.addEventListener("mouseover", onOver);
    document.addEventListener("mouseleave", onLeaveViewport);
    document.addEventListener("mouseenter", onEnterViewport);

    rafId = window.requestAnimationFrame(update);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("mouseout", onOut);
      window.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseleave", onLeaveViewport);
      document.removeEventListener("mouseenter", onEnterViewport);
      document.documentElement.setAttribute("data-cursor", "default");
    };
  }, []);

  return (
    <div ref={rootRef} className="custom-cursor" aria-hidden="true">
      <div ref={ringRef} className="custom-cursor-ring" />
      <div ref={dotRef} className="custom-cursor-dot" />
    </div>
  );
}
