'use client';

import { motion, useInView, useAnimation, Variant } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

interface SplitTextProps {
  text: string;
  className?: string;
  delay?: number;
  animationFrom?: Variant;
  animationTo?: Variant;
  threshold?: number;
  rootMargin?: string;
  textAlign?: 'left' | 'right' | 'center' | 'justify' | 'start' | 'end';
  onLetterAnimationComplete?: () => void;
  split?: boolean; // <--- NUEVA PROPIEDAD
}

const SplitText: React.FC<SplitTextProps> = ({
  text = '',
  className = '',
  delay = 100,
  animationFrom = { opacity: 0, y: 40 },
  animationTo = { opacity: 1, y: 0 },
  threshold = 0.1,
  rootMargin = '-50px',
  textAlign = 'center',
  onLetterAnimationComplete,
  split = true, // Por defecto divide el texto
}) => {
  const words = text.split(' ').map(word => word.split(''));
  const letters = words.flat();
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLParagraphElement>(null);
  
  // Corrección del error de tipo: 'as any'
  const isInView = useInView(ref, { once: true, amount: threshold, margin: rootMargin as any });
  
  const controls = useAnimation();

  useEffect(() => {
    if (isInView) {
      setInView(true);
      controls.start('visible');
    }
  }, [isInView, controls]);

  // --- MODO BLOQUE (Para textos con Gradientes) ---
  if (!split) {
    return (
      <p
        ref={ref}
        style={{ textAlign, whiteSpace: 'normal', wordWrap: 'break-word', display: 'inline-block' }}
      >
        <motion.span
           // Aplicamos la clase AQUÍ para que el gradiente se mueva con el texto
           className={className}
           initial="hidden"
           animate={controls}
           variants={{
             hidden: animationFrom,
             visible: {
               ...animationTo,
               transition: { delay: delay / 1000, type: "spring", stiffness: 100, damping: 15 },
             }
           }}
           style={{ display: 'inline-block' }}
        >
          {text}
        </motion.span>
      </p>
    );
  }

  // --- MODO ORIGINAL (Letra por letra) ---
  return (
    <p
      ref={ref}
      className={`inline-block ${className}`}
      style={{ textAlign, whiteSpace: 'normal', wordWrap: 'break-word' }}
    >
      {words.map((word, wordIndex) => (
        <span key={wordIndex} style={{ display: 'inline-block', whiteSpace: 'nowrap' }}>
          {word.map((letter, letterIndex) => {
            const index = words
              .slice(0, wordIndex)
              .reduce((acc, w) => acc + w.length, 0) + letterIndex;

            return (
              <motion.span
                key={index}
                initial="hidden"
                animate={controls}
                variants={{
                  hidden: animationFrom,
                  visible: {
                    ...animationTo,
                    transition: { delay: index * 0.03 + delay / 1000, type: "spring", stiffness: 100, damping: 15 },
                  },
                }}
                style={{ display: 'inline-block', willChange: 'transform, opacity' }}
                onAnimationComplete={() => {
                  if (index === letters.length - 1 && onLetterAnimationComplete) {
                    onLetterAnimationComplete();
                  }
                }}
              >
                {letter}
              </motion.span>
            );
          })}
          <span style={{ display: 'inline-block', width: '0.3em' }}>&nbsp;</span>
        </span>
      ))}
    </p>
  );
};

export default SplitText;