import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  color: string;
  gravity: number;
}

const Fireworks = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const particlesRef = useRef<Particle[]>([]);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Firework colors
    const colors = [
      "#FFD700", // Gold
      "#FFA500", // Orange
      "#FF6347", // Red
      "#FF1493", // Pink
      "#00CED1", // Cyan
      "#9370DB", // Purple
      "#32CD32", // Green
    ];

    // Create firework explosion
    const createFirework = (x: number, y: number) => {
      const particleCount = 50;
      const color = colors[Math.floor(Math.random() * colors.length)];

      for (let i = 0; i < particleCount; i++) {
        const angle = (Math.PI * 2 * i) / particleCount;
        const velocity = 2 + Math.random() * 4;
        
        particlesRef.current.push({
          x,
          y,
          vx: Math.cos(angle) * velocity,
          vy: Math.sin(angle) * velocity,
          alpha: 1,
          color,
          gravity: 0.05,
        });
      }
    };

    // Launch fireworks at intervals
    const launchFirework = () => {
      const x = window.innerWidth * (0.2 + Math.random() * 0.6);
      const y = window.innerHeight * (0.2 + Math.random() * 0.4);
      createFirework(x, y);
    };

    // Initial fireworks
    launchFirework();
    const interval1 = setTimeout(() => launchFirework(), 400);
    const interval2 = setTimeout(() => launchFirework(), 800);
    const interval3 = setTimeout(() => launchFirework(), 1200);
    const interval4 = setTimeout(() => launchFirework(), 1600);
    const interval5 = setTimeout(() => launchFirework(), 2000);
    const interval6 = setTimeout(() => launchFirework(), 2400);

    // Animation loop
    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current;
      
      // Stop after 3 seconds
      if (elapsed > 3000) {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
        return;
      }

      ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      particlesRef.current = particlesRef.current.filter((particle) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += particle.gravity;
        particle.alpha -= 0.01;

        if (particle.alpha > 0) {
          ctx.save();
          ctx.globalAlpha = particle.alpha;
          ctx.fillStyle = particle.color;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          return true;
        }
        return false;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Cleanup
    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      clearTimeout(interval1);
      clearTimeout(interval2);
      clearTimeout(interval3);
      clearTimeout(interval4);
      clearTimeout(interval5);
      clearTimeout(interval6);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
      style={{ background: "transparent" }}
    />
  );
};

export default Fireworks;
