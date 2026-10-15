'use strict';
(() => {
  const preferenceKey = 'isopod-sounds-enabled';
  let enabled = true;
  try {
    const saved = localStorage.getItem(preferenceKey);
    if (saved !== null) enabled = saved !== 'false';
  } catch {}

  let context;
  let master;

  function audio() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    if (!context) {
      context = new AudioContext();
      master = context.createGain();
      master.gain.value = 0.48;
      master.connect(context.destination);
    }
    if (context.state === 'suspended') context.resume().catch(() => {});
    return context;
  }

  function tone({ frequency, endFrequency = frequency, start, duration, volume, type = 'sine' }) {
    const ctx = audio();
    if (!ctx || !enabled) return;
    const oscillator = ctx.createOscillator();
    const envelope = ctx.createGain();
    const begins = start ?? ctx.currentTime;
    const ends = begins + duration;
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, begins);
    if (endFrequency !== frequency) oscillator.frequency.exponentialRampToValueAtTime(endFrequency, ends);
    envelope.gain.setValueAtTime(0.0001, begins);
    envelope.gain.exponentialRampToValueAtTime(volume, begins + Math.min(0.012, duration / 4));
    envelope.gain.exponentialRampToValueAtTime(0.0001, ends);
    oscillator.connect(envelope);
    envelope.connect(master);
    oscillator.start(begins);
    oscillator.stop(ends + 0.015);
  }

  const sounds = {
    add() {
      const ctx = audio();
      if (!ctx || !enabled) return;
      const now = ctx.currentTime;
      [587.33, 739.99, 880].forEach((frequency, index) => tone({
        frequency, start: now + index * 0.052, duration: 0.19 - index * 0.025,
        volume: 0.045 - index * 0.008, type: 'triangle'
      }));
    },
    remove() {
      const ctx = audio();
      if (!ctx || !enabled) return;
      tone({ frequency: 310, endFrequency: 190, start: ctx.currentTime, duration: 0.19, volume: 0.105, type: 'triangle' });
      tone({ frequency: 155, start: ctx.currentTime + 0.015, duration: 0.08, volume: 0.045 });
    },
    product() {
      const ctx = audio();
      if (!ctx || !enabled) return;
      const now = ctx.currentTime;
      tone({ frequency: 440, start: now, duration: 0.12, volume: 0.065, type: 'sine' });
      tone({ frequency: 554.37, start: now + 0.055, duration: 0.15, volume: 0.05, type: 'sine' });
    },
    bag() {
      const ctx = audio();
      if (!ctx || !enabled) return;
      const now = ctx.currentTime;
      tone({ frequency: 392, start: now, duration: 0.13, volume: 0.07, type: 'triangle' });
      tone({ frequency: 523.25, start: now + 0.06, duration: 0.15, volume: 0.055, type: 'triangle' });
    },
    close() {
      const ctx = audio();
      if (!ctx || !enabled) return;
      tone({ frequency: 440, endFrequency: 350, start: ctx.currentTime, duration: 0.07, volume: 0.045 });
    },
    select() {
      const ctx = audio();
      if (!ctx || !enabled) return;
      tone({ frequency: 659.25, start: ctx.currentTime, duration: 0.065, volume: 0.045, type: 'triangle' });
    },
    success() {
      const ctx = audio();
      if (!ctx || !enabled) return;
      const now = ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => tone({
        frequency, start: now + index * 0.08, duration: 0.23, volume: 0.095 - index * 0.012, type: 'sine'
      }));
    }
  };

  function updateToggle() {
    const button = document.querySelector('#soundToggle');
    if (!button) return;
    button.setAttribute('aria-pressed', String(enabled));
    button.setAttribute('aria-label', enabled ? 'Desativar efeitos sonoros' : 'Ativar efeitos sonoros');
    button.title = enabled ? 'Desativar efeitos sonoros' : 'Ativar efeitos sonoros';
    button.querySelector('.sound-wave-one').hidden = !enabled;
    button.querySelector('.sound-wave-two').hidden = !enabled;
    button.querySelector('.sound-mute').hidden = enabled;
    button.querySelector('.sr-only').textContent = enabled ? 'Efeitos sonoros ativados' : 'Efeitos sonoros desativados';
    button.classList.toggle('is-muted', !enabled);
  }

  document.querySelector('#soundToggle').addEventListener('click', () => {
    enabled = !enabled;
    try { localStorage.setItem(preferenceKey, String(enabled)); } catch {}
    updateToggle();
    if (enabled) sounds.select();
  });

  updateToggle();
  window.isopodSounds = { play(name) { if (enabled) sounds[name]?.(); } };
})();
