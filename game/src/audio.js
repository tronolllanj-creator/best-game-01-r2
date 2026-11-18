export function createAudio() {
  let ctx = null;
  let masterGain = null;
  let muted = false;

  function init() {
    if (ctx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    ctx = new AudioContext();
    masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.4, ctx.currentTime);
    masterGain.connect(ctx.destination);
  }

  function unlock() {
    init();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume();
    }
  }

  function setMuted(val) {
    muted = !!val;
    if (masterGain && ctx) {
      masterGain.gain.setValueAtTime(muted ? 0 : 0.4, ctx.currentTime);
    }
  }

  function shoot() {
    if (muted || !ctx) return;
    unlock();
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(150, t + 0.08);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(t);
    osc.stop(t + 0.08);
  }

  function explode(size = 1) {
    if (muted || !ctx) return;
    unlock();
    const t = ctx.currentTime;
    const duration = 0.15 + size * 0.15;
    
    // Noise buffer
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(300 + size * 200, t);
    filter.frequency.linearRampToValueAtTime(40, t + duration);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.5 * Math.min(size, 2), t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    noise.start(t);
  }

  function pickup() {
    if (muted || !ctx) return;
    unlock();
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.setValueAtTime(880, t + 0.06);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(t);
    osc.stop(t + 0.15);
  }

  function hurt() {
    if (muted || !ctx) return;
    unlock();
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.2);

    gain.gain.setValueAtTime(0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(t);
    osc.stop(t + 0.2);
  }

  function wave() {
    if (muted || !ctx) return;
    unlock();
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.linearRampToValueAtTime(330, t + 0.4);
    osc.frequency.linearRampToValueAtTime(440, t + 0.8);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.9);

    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(t);
    osc.stop(t + 0.9);
  }

  function dash() {
    if (muted || !ctx) return;
    unlock();
    const t = ctx.currentTime;
    const bufferSize = ctx.sampleRate * 0.2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, t);
    filter.frequency.linearRampToValueAtTime(300, t + 0.2);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    noise.start(t);
  }

  function win() {
    if (muted || !ctx) return;
    unlock();
    const t = ctx.currentTime;
    const notes = [261.63, 329.63, 392.00, 523.25];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const noteTime = t + i * 0.15;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.3, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.4);

      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(noteTime);
      osc.stop(noteTime + 0.4);
    });
  }

  function lose() {
    if (muted || !ctx) return;
    unlock();
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.linearRampToValueAtTime(50, t + 0.8);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);

    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(t);
    osc.stop(t + 0.8);
  }

  function coin() {
    if (muted || !ctx) return;
    unlock();
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, t);
    osc.frequency.setValueAtTime(1318.51, t + 0.08);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(t);
    osc.stop(t + 0.25);
  }

  function bossAlarm() {
    if (muted || !ctx) return;
    unlock();
    const t = ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const start = t + i * 0.2;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, start);
      osc.frequency.linearRampToValueAtTime(440, start + 0.15);

      gain.gain.setValueAtTime(0.3, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.15);

      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(start);
      osc.stop(start + 0.15);
    }
  }

  return {
    unlock,
    shoot,
    explode,
    pickup,
    hurt,
    wave,
    dash,
    win,
    lose,
    coin,
    bossAlarm,
    setMuted,
    get muted() { return muted; }
  };
}
