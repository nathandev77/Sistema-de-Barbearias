import React, { createContext, useContext, useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { cn } from '@/lib/utils';

const CursorContext = createContext(null);

export function CursorProvider({ children, global = true }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      x.set(e.clientX);
      y.set(e.clientY);
      if (!isActive) setIsActive(true);
    };

    if (global) {
      window.addEventListener('mousemove', handleMouseMove);
      return () => window.removeEventListener('mousemove', handleMouseMove);
    }
  }, [global, x, y, isActive]);

  return (
    <CursorContext.Provider value={{ x, y, isActive, global }}>
      {children}
    </CursorContext.Provider>
  );
}

export function CursorContainer({ children, className }) {
  const context = useContext(CursorContext);
  
  const handleMouseMove = (e) => {
    if (context && !context.global) {
      context.x.set(e.clientX);
      context.y.set(e.clientY);
    }
  };

  return (
    <div
      className={cn("w-full h-full", className)}
      onMouseMove={handleMouseMove}
    >
      {children}
    </div>
  );
}

export function Cursor({ children, className }) {
  const context = useContext(CursorContext);
  if (!context) return null;
  const { x, y, isActive } = context;

  const springX = useSpring(x, { stiffness: 500, damping: 28 });
  const springY = useSpring(y, { stiffness: 500, damping: 28 });

  if (!isActive) return null;

  return (
    <motion.div
      style={{ x: springX, y: springY }}
      className={cn("pointer-events-none fixed top-0 left-0 z-[100]", className)}
    >
      {children}
    </motion.div>
  );
}

export function CursorFollow({ children, side = 'bottom', sideOffset = 15, align = 'end', alignOffset = 5 }) {
  const context = useContext(CursorContext);
  if (!context) return null;
  const { x, y, isActive } = context;

  const springX = useSpring(x, { stiffness: 300, damping: 28 });
  const springY = useSpring(y, { stiffness: 300, damping: 28 });

  let transformStr = '';
  
  if (side === 'bottom') transformStr += `translateY(${sideOffset}px) `;
  if (side === 'top') transformStr += `translateY(-${sideOffset}px) `;
  if (side === 'right') transformStr += `translateX(${sideOffset}px) `;
  if (side === 'left') transformStr += `translateX(-${sideOffset}px) `;

  if (align === 'end') transformStr += `translateX(${alignOffset}px) `;
  if (align === 'start') transformStr += `translateX(-${alignOffset}px) `;

  if (!isActive) return null;

  return (
    <motion.div
      style={{ x: springX, y: springY }}
      className="pointer-events-none fixed top-0 left-0 z-[100]"
    >
      <div style={{ transform: transformStr }} className="transition-transform duration-100">
        {children}
      </div>
    </motion.div>
  );
}
