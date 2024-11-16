import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

export default function FPSCounter({ className }) {
  const [fps, setFps] = useState(0);
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());
  const animationFrameId = useRef();

  useEffect(() => {
    const updateFPS = () => {
      frameCount.current++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime.current >= 1000) {
        setFps(frameCount.current);
        frameCount.current = 0;
        lastTime.current = currentTime;
      }
      
      animationFrameId.current = requestAnimationFrame(updateFPS);
    };

    animationFrameId.current = requestAnimationFrame(updateFPS);

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, []);

  return (
    <div className={className}>
      {fps} FPS
    </div>
  );
}

FPSCounter.propTypes = {
  className: PropTypes.string
};