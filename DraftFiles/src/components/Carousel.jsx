import React, { useEffect, useRef, useState } from "react";

// Prefix relative asset paths with the correct base (e.g. /cgo-club/)
const withBase = (p) => {
  if (!p) return p;
  if (/^https?:\/\//i.test(p)) return p;     // leave absolute URLs
  const cleaned = String(p).replace(/^\/+/, ""); // strip any leading '/'
  return import.meta.env.BASE_URL + cleaned;
};

export default function Carousel({ images = [], intervalMs = 4000, height = 320 }) {
  const [idx, setIdx] = useState(0);
  const timerRef = useRef(null);
  const touch = useRef({ x: 0 });

  useEffect(() => {
    if (images.length <= 1) return;
    timerRef.current = setInterval(() => setIdx(i => (i + 1) % images.length), intervalMs);
    return () => clearInterval(timerRef.current);
  }, [images.length, intervalMs]);

  const prev = () => setIdx(i => (i - 1 + images.length) % images.length);
  const next = () => setIdx(i => (i + 1) % images.length);

  const onTouchStart = e => { touch.current.x = e.touches[0].clientX; };
  const onTouchEnd = e => {
    const dx = e.changedTouches[0].clientX - touch.current.x;
    if (Math.abs(dx) > 40) (dx > 0 ? prev() : next());
  };

  if (!images.length) return null;

  const src = withBase(images[idx]);

  return (
    <div className="carousel" style={{ height }} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <img src={src} alt={`slide-${idx}`} className="carousel-img" />
      {images.length > 1 && (
        <>
          <button className="carousel-btn left" onClick={prev} aria-label="Previous">‹</button>
          <button className="carousel-btn right" onClick={next} aria-label="Next">›</button>
          <div className="carousel-dots">
            {images.map((_, i) => (
              <button
                key={i}
                className={`dot ${i === idx ? "active" : ""}`}
                onClick={() => setIdx(i)}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}