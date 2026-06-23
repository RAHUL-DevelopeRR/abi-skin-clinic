import { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

export default function TiltedCard({
  children,
  className = "",
  tiltMaxAngleX = 12,
  tiltMaxAngleY = 12,
  perspective = 1000,
}) {
  const ref = useRef(null);
  
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);
  
  const springConfig = { damping: 25, stiffness: 200, mass: 0.6 };
  const rotateXSpring = useSpring(y, springConfig); // Y mouse position controls X rotation
  const rotateYSpring = useSpring(x, springConfig); // X mouse position controls Y rotation
  
  const rotateX = useTransform(rotateXSpring, [0, 1], [tiltMaxAngleX, -tiltMaxAngleX]);
  const rotateY = useTransform(rotateYSpring, [0, 1], [-tiltMaxAngleY, tiltMaxAngleY]);

  const handleMouseMove = (event) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    
    // Normalize coordinates to [0, 1]
    const normalizedX = mouseX / width;
    const normalizedY = mouseY / height;
    
    x.set(normalizedX);
    y.set(normalizedY);
  };

  const handleMouseLeave = () => {
    x.set(0.5);
    y.set(0.5);
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ perspective: `${perspective}px` }}
      className={`relative ${className}`}
    >
      <motion.div
        style={{
          rotateX: rotateX,
          rotateY: rotateY,
          transformStyle: "preserve-3d",
        }}
        className="w-full h-full"
      >
        {children}
      </motion.div>
    </div>
  );
}
