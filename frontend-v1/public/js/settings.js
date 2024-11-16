// Settings management
const defaultSettings = {
  graphics: {
    setting1: 'default',
    setting2: 'default'
  },
  sound: {
    masterVolume: 75,
    musicVolume: 75,
    sfxVolume: 75,
    chimes: {
      playerServer: true,
      playerGame: true,
      lobbyMessage: true,
      gameMessage: true
    }
  }
};

export const settings = {
  load() {
    const stored = localStorage.getItem('gameSettings');
    if (!stored) {
      localStorage.setItem('gameSettings', JSON.stringify(defaultSettings));
      return defaultSettings;
    }
    return JSON.parse(stored);
  },

  save(settings) {
    localStorage.setItem('gameSettings', JSON.stringify(settings));
  },

  // Update specific section
  updateSection(section, values) {
    const current = this.load();
    current[section] = { ...current[section], ...values };
    this.save(current);
    return current;
  }
};

// Initialize settings on load
document.addEventListener('DOMContentLoaded', () => {
  settings.load();
});