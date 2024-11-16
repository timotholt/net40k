import { useState, useRef } from 'react';
import { useSound } from '../../context/SoundContext';
import styles from './SoundControls.module.css';

function SoundControls() {
  const soundManager = useSound();
  const [isMuted, setIsMuted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef(null);

  const handleMuteToggle = () => {
    const newMutedState = soundManager.toggleMute();
    setIsMuted(newMutedState);
  };

  const calculateVolume = (clientY) => {
    const rect = sliderRef.current.getBoundingClientRect();
    const height = rect.height;
    const y = clientY - rect.top;
    return 1 - Math.max(0, Math.min(y, height)) / height;
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    const volume = calculateVolume(e.clientY);
    soundManager.setVolume(volume);
    sliderRef.current.value = volume;
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const volume = calculateVolume(e.clientY);
    soundManager.setVolume(volume);
    sliderRef.current.value = volume;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const currentVolume = parseFloat(sliderRef.current.value);
    const newVolume = Math.max(0, Math.min(1, currentVolume + delta));
    soundManager.setVolume(newVolume);
    sliderRef.current.value = newVolume;
  };

  return (
    <div 
      className={styles.controls}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <input
        ref={sliderRef}
        type="range"
        min="0"
        max="1"
        step="0.01"
        defaultValue="0.3"
        className={styles.volumeSlider}
        onMouseDown={handleMouseDown}
        onWheel={handleWheel}
      />
      <button
        onClick={handleMuteToggle}
        className={`${styles.muteButton} ${isMuted ? styles.muted : ''}`}
      >
        {isMuted ? '🔇' : '🔊'}
      </button>
    </div>
  );
}

export default SoundControls;