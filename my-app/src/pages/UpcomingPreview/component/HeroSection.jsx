import { useState, useEffect,} from 'react';


import { sliderImages } from '../../../constant/sliderImg';


export default function HeroSection() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % sliderImages.length);
    }, 4000);

    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative h-64 rounded-3xl overflow-hidden group">
      <div 
        className="flex w-full h-full transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {sliderImages.map((src, index) => (
          <img
            key={index}
            src={src}
            alt={`Botanical Care ${index + 1}`}
            className="w-full h-full object-cover flex-shrink-0 transition-transform duration-700 group-hover:scale-105"
          />
        ))}
      </div>
      
      {/* Text Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex flex-col justify-end p-6 sm:p-10">
        <div className="pointer-events-none">
          <h1
            className="text-white font-bold mb-1"
            style={{ fontSize: 'clamp(28px, 5vw, 48px)', letterSpacing: '-0.05em' }}
          >
            Daily Botanical Pulse
          </h1>
          <p className="text-white/90 text-base max-w-lg">
            High-precision care protocols for your organic collection.
          </p>
        </div>
      </div>

      {/* Navigation Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {sliderImages.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              currentIndex === index 
                ? 'bg-white scale-125' 
                : 'bg-white/50 hover:bg-white/80'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
