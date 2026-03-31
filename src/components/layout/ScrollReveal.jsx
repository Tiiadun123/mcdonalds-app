import { useEffect, useRef, useState } from 'react';

export default function ScrollReveal({ children, animation = 'animate-slide-in-up', duration = 800, delay = 0, className = '' }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        observer.unobserve(ref.current);
      }
    };
  }, []);

  return (
    <div 
      ref={ref} 
      className={`${className} ${isVisible ? animation : 'opacity-0'} `}
      style={{
         animationDuration: isVisible ? `${duration}ms` : undefined,
         animationDelay: isVisible ? `${delay}ms` : undefined,
         animationFillMode: 'forwards'
      }}
    >
      {children}
    </div>
  );
}
