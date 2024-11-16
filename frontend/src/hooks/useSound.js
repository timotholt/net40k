import { useEffect, useRef } from 'react';
import { Howl } from 'howler';

export function useSoundSystem() {
  const bgMusic = useRef(null);
  const isMuted = useRef(false);

  const sounds = {
    hover: new Howl({
      src: ['/sounds/hover.mp3'],
      volume: 0.5
    }),
    click: new Howl({
      src: ['/sounds/click.mp3'],
      volume: 0.6
    }),
    transition: new Howl({
      src: ['/sounds/transition.mp3'],
      volume: 0.4
    })
  };

  useEffect(() => {
    // Initialize background music
    bgMusic.current = new Howl({
      src: ['/sounds/background.mp3'],
      loop: true,
      volume: 0.3,
      autoplay: false
    });

    return () => {
      // Cleanup
      bgMusic.current?.unload();
      Object.values(sounds).forEach(sound => sound.unload());
    };
  }, []);

  const playSound = (soundName) => {
    if (!isMuted.current && sounds[soundName]) {
      sounds[soundName].play();
    }
  };

  const toggleMute = () => {
    isMuted.current = !isMuted.current;
    if (isMuted.current) {
      bgMusic.current?.pause();
      Howler.mute(true);
    } else {
      bgMusic.current?.play();
      Howler.mute(false);
    }
    return isMuted.current;
  };

  const setVolume = (volume) => {
    bgMusic.current?.volume(volume);
  };

  const startBackgroundMusic = () => {
    if (!isMuted.current) {
      bgMusic.current?.play();
    }
  };

  return {
    playSound,
    toggleMute,
    setVolume,
    startBackgroundMusic
  };
}