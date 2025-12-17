'use client';

import { useState, useEffect } from 'react';

interface TextTypeProps {
  text: string;
  delay?: number;
  speed?: number;
  className?: string;
  onComplete?: () => void;
}

const TextType: React.FC<TextTypeProps> = ({
  text,
  delay = 0,
  speed = 50,
  className = '',
  onComplete
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [started, setStarted] = useState(false);

  useEffect(() => {
    // 1. Esperar el delay inicial
    const startTimeout = setTimeout(() => {
      setStarted(true);
    }, delay);

    return () => clearTimeout(startTimeout);
  }, [delay]);

  useEffect(() => {
    if (!started) return;

    let currentIndex = 0;
    
    // Aseguramos que empiece limpio
    setDisplayedText(''); 

    const intervalId = setInterval(() => {
      // Método SLICE (Infalible): Cortamos el texto original
      // Esto evita que se pierdan letras por errores de estado
      if (currentIndex < text.length) {
        setDisplayedText(text.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(intervalId);
        if (onComplete) onComplete();
      }
    }, speed);

    return () => clearInterval(intervalId);
  }, [started, text, speed, onComplete]);

  return (
    <span className={className}>
      {displayedText}
    </span>
  );
};

export default TextType;