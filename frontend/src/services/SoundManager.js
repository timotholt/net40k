// Abstract base class for sound implementations
export class SoundImplementation {
  initialize() { throw new Error('Not implemented'); }
  play() { throw new Error('Not implemented'); }
  startBackground() { throw new Error('Not implemented'); }
  stopBackground() { throw new Error('Not implemented'); }
  setVolume() { throw new Error('Not implemented'); }
  toggleMute() { throw new Error('Not implemented'); }
}

export class SoundManager {
  constructor(implementation) {
    this.implementation = implementation;
  }

  setImplementation(implementation) {
    if (!(implementation instanceof SoundImplementation)) {
      throw new Error('Invalid sound implementation');
    }
    this.implementation = implementation;
  }

  initialize() {
    if (!this.implementation) return;
    this.implementation.initialize();
  }

  play(soundId) {
    if (!this.implementation) return;
    this.implementation.play(soundId);
  }

  startBackgroundMusic() {
    if (!this.implementation) return;
    this.implementation.startBackground();
  }

  stopBackgroundMusic() {
    if (!this.implementation) return;
    this.implementation.stopBackground();
  }

  setVolume(volume) {
    if (!this.implementation) return;
    this.implementation.setVolume(volume);
  }

  toggleMute() {
    if (!this.implementation) return false;
    return this.implementation.toggleMute();
  }
}

export const soundManager = new SoundManager(null);