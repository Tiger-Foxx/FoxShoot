import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PhotoIcon, FilmIcon, ArrowRightIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

const IMAGES = [
  '/image1.png',
  '/image2.png',
  '/image3.jpg'
];

export const LandingPage = ({ onSelectMode, onOpenSettings }) => {
  const [currentImage, setCurrentImage] = useState(0);

  // Slideshow Logic
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % IMAGES.length);
    }, 8000); // Change image every 8s (slower)
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden flex flex-col items-center justify-center bg-black">
      
      {/* BACKGROUND SLIDESHOW */}
      <AnimatePresence mode="popLayout">
        <motion.img
          key={currentImage}
          src={IMAGES[currentImage]}
          alt="Background"
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 0.6, scale: 1 }} // Higher opacity, no grayscale
          exit={{ opacity: 0 }}
          transition={{ duration: 2.5, ease: "easeInOut" }} // Smoother transition
          className="absolute inset-0 w-full h-full object-cover"
        />
      </AnimatePresence>
      
      {/* GRADIENT OVERLAY (To Ensure Text Readability but keep center clear) */ }
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_0%,rgba(0,0,0,0.8)_100%)] pointer-events-none" />

      {/* SETTINGS BUTTON */}
      <button 
        onClick={onOpenSettings}
        className="absolute top-6 right-6 z-20 p-2.5 border border-white/10 hover:border-primary/50 bg-black/50 backdrop-blur-sm text-gray-400 hover:text-primary transition-all"
        title="Settings"
      >
        <Cog6ToothIcon className="w-5 h-5" />
      </button>

      {/* CONTENT */}
      <div className="z-10 flex flex-col items-center space-y-12 max-w-4xl text-center">
        
        {/* HERO TITLES */}
        <motion.div 
           initial={{ y: 20, opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           className="space-y-2"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
             <img src="/logo-fox-shoot.png" className="w-12 h-12 object-contain" />
          </div>
          <h1 className="text-6xl font-black tracking-tighter text-white uppercase">
            Fox<span className="text-primary">Shoot</span>
          </h1>
          <p className="text-sm font-mono text-gray-500 tracking-[0.3em] uppercase">
            Neural Restoration Studio v3.0
          </p>
        </motion.div>

        {/* MODE SELECTION */}
        <div className="flex gap-8">
          
          <ModeCard 
            title="Image Studio"
            subtitle="Upscale & Denoise Stills"
            icon={PhotoIcon}
            onClick={() => onSelectMode('image')}
            delay={0.1}
          />
          
          <ModeCard 
            title="Video Lab"
            subtitle="Frame Interpolation & Restoration"
            icon={FilmIcon}
            onClick={() => onSelectMode('video')}
            delay={0.2}
          />

        </div>
      </div>
      
      {/* FOOTER */}
      <div className="absolute bottom-8 flex flex-col items-center gap-2">
         <div className="text-[10px] text-gray-600 font-mono tracking-widest">
           SYSTEM READY • GPU ACCELERATION DETECTED
         </div>
         <a 
           href="https://github.com/Tiger-Foxx" 
           target="_blank" 
           rel="noopener noreferrer"
           className="text-[10px] text-gray-700 hover:text-primary transition-colors font-mono"
         >
           made with 🦊 by <span className="text-primary">Fox</span>
         </a>
      </div>
    </div>
  );
};

const ModeCard = ({ title, subtitle, icon: Icon, onClick, delay }) => (
  <motion.button
    initial={{ y: 20, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ delay, duration: 0.5 }}
    onClick={onClick}
    className="group relative w-64 h-80 bg-black/60 border border-white/10 hover:border-primary/50 flex flex-col items-center justify-center gap-6 p-6 transition-all duration-500 hover:bg-black/80 backdrop-blur-md"
  >
    <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    
    <div className="w-16 h-16 rounded-none border border-white/20 flex items-center justify-center group-hover:border-primary group-hover:text-primary text-gray-400 transition-all duration-300">
       <Icon className="w-8 h-8" />
    </div>

    <div className="space-y-2 relative z-10">
      <h3 className="text-xl font-bold text-white uppercase tracking-wider group-hover:text-primary transition-colors">
        {title}
      </h3>
      <p className="text-xs text-gray-500 font-mono">
        {subtitle}
      </p>
    </div>

    <div className="absolute bottom-6 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 text-primary">
       <ArrowRightIcon className="w-5 h-5" />
    </div>
  </motion.button>
);
