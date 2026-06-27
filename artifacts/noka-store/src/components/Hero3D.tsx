import { useEffect, useRef } from "react";

export default function Hero3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let t = 0;

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener("resize", resize);

    function drawRing(
      cx: number, cy: number,
      rx: number, ry: number,
      thickness: number,
      color: string,
      rotation: number
    ) {
      ctx!.save();
      ctx!.translate(cx, cy);
      ctx!.rotate(rotation);
      ctx!.scale(1, ry / rx);

      const grad = ctx!.createLinearGradient(-rx, 0, rx, 0);
      grad.addColorStop(0, color + "33");
      grad.addColorStop(0.4, color + "cc");
      grad.addColorStop(0.6, color + "ff");
      grad.addColorStop(1, color + "33");

      ctx!.beginPath();
      ctx!.arc(0, 0, rx + thickness / 2, 0, Math.PI * 2);
      ctx!.arc(0, 0, rx - thickness / 2, 0, Math.PI * 2, true);
      ctx!.fillStyle = grad;
      ctx!.fill();
      ctx!.restore();
    }

    function draw() {
      const W = canvas!.offsetWidth;
      const H = canvas!.offsetHeight;
      ctx!.clearRect(0, 0, W, H);

      const cx = W / 2;
      const cy = H / 2;
      const baseR = Math.min(W, H) * 0.28;
      const float = Math.sin(t * 0.8) * 14;

      drawRing(cx, cy + float, baseR, baseR * 0.42, baseR * 0.32, "#c27b4a", t * 0.25);
      drawRing(cx, cy + float * 0.6, baseR * 0.62, baseR * 0.26, baseR * 0.18, "#e09a5a", -t * 0.4 + Math.PI / 4);
      drawRing(cx, cy + float * 0.3, baseR * 0.35, baseR * 0.16, baseR * 0.1, "#d4b896", t * 0.6);

      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2 + t * 0.5;
        const orbitR = baseR * 1.18;
        const ox = cx + Math.cos(angle) * orbitR;
        const oy = cy + float + Math.sin(angle) * orbitR * 0.38;
        const size = (3 + i * 0.8) * (1 + 0.3 * Math.sin(t + i));
        const alpha = 0.4 + 0.5 * Math.abs(Math.sin(angle));
        ctx!.beginPath();
        ctx!.arc(ox, oy, size, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(${i % 2 === 0 ? "194,123,74" : "224,154,90"},${alpha})`;
        ctx!.fill();
      }

      const glow = ctx!.createRadialGradient(cx, cy + float, 0, cx, cy + float, baseR * 1.4);
      glow.addColorStop(0, "rgba(194,123,74,0.08)");
      glow.addColorStop(1, "rgba(194,123,74,0)");
      ctx!.beginPath();
      ctx!.arc(cx, cy + float, baseR * 1.4, 0, Math.PI * 2);
      ctx!.fillStyle = glow;
      ctx!.fill();

      t += 0.012;
      animId = requestAnimationFrame(draw);
    }

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", height: "100%", display: "block" }}
    />
  );
}
