import React, { useState, useEffect } from 'react';
import '../assets/css/loader.css';
import { motion, useAnimation } from 'framer-motion';

const Loader = () => {
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      if (loadingProgress < 100) {
        setLoadingProgress(loadingProgress + 10);
      } else {
        clearInterval(interval);
      }
    }, 800); 

    return () => clearInterval(interval);
  }, [loadingProgress]);

  const cupControls = useAnimation();

  const rotateAndScaleAnimation = async () => {
 
    await cupControls.start({ rotate: 720, transition: { duration: 1.2 } });


    await new Promise(resolve => setTimeout(resolve, 200));


    await cupControls.start({ rotate: 1440, transition: { duration: 1.2 } });


    await cupControls.start({ scale: 15, opacity: 0, transition: { duration: 0.7 } });
  };

  useEffect(() => {
    // StrictMode remounts in dev, which makes framer-motion reject start() on the unmounted pass
    rotateAndScaleAnimation().catch(() => {});
  }, []);

  return (
    <div className="loader-container">
      <motion.div
        className="cup-icon"
        animate={cupControls}
        initial={{ rotate: 0 }}
      >
        <div className="trophy-icon">🏆</div>
      </motion.div>
      <div className="loading-bar">
        <div
          className="loading-progress"
          style={{ width: `${loadingProgress}%` }}
        ></div>
      </div>
    </div>
  );
};

export default Loader;
