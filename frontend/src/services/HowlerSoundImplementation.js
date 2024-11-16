import { Howl, Howler } from 'howler';
import { SoundImplementation } from './SoundManager';

export class HowlerSoundImplementation extends SoundImplementation {
  constructor() {
    super();
    this.sounds = new Map();
    this.backgroundMusic = null;
    this.isMuted = false;
  }

  initialize() {
    try {
      this.sounds.set('hover', new Howl({
        src: ['/sounds/hover.mp3'],
        volume: 0.5,
        preload: false
      }));

      this.sounds.set('click', new Howl({
        src: ['/sounds/click.mp3'],
        volume: 0.6,
        preload: false
      }));

      this.sounds.set('transition', new Howl({
        src: ['/sounds/transition.mp3'],
        volume: 0.4,
        preload: false
      }));

      this.backgroundMusic = new Howl({
        src: ['/sounds/background.mp3'],
        loop: true,
        volume: 0.3,
        preload: false
      });
    } catch (error) {
      console.warn('Sound initialization failed', error);
    }
  }

  play(soundId) {
    try {
      const sound = this.sounds.get(soundId);
      if (sound && !this.isMuted) {
        sound.play();
      }
    } catch (error) {
      console.warn(`Failed to play sound: ${soundId}`, error);
    }
  }

  startBackground() {
    try {
      if (this.backgroundMusic && !this.isMuted) {
        this.backgroundMusic.play();
      }
    } catch (error) {
      console.warn('Failed to start background music', error);
    }
  }

  stopBackground() {
    try {
      if (this.backgroundMusic) {
        this.backgroundMusic.stop();
      }
    } catch (error) {
      console.warn('Failed to stop background music', error);
    }
  }

  setVolume(volume) {
    try {
      if (this.backgroundMusic) {
        this.backgroundMusic.volume(volume);
      }
      this.sounds.forEach(sound => {
        sound.volume(volume);
      });
    } catch (error) {
      console.warn('Failed to set volume', error);
    }
  }

  toggleMute() {
    try {
      this.isMuted = !this.isMuted;
      if (this.isMuted) {
        this.stopBackground();
        Howler.mute(true);
      } else {
        this.startBackground();
        Howler.mute(false);
      }
      return this.isMuted;
    } catch (error) {
      console.warn('Failed to toggle mute', error);
      return false;
    }
  }
}

export const howlerImplementation = new HowlerSoundImplementation();