"use client";

class SoundManager {
  private audioCtx: AudioContext | null = null;
  private enabled: boolean = true;

  private init() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  private musicOsc: OscillatorNode | null = null;
  private musicGain: GainNode | null = null;

  startMusic() {
    if (!this.enabled) return;
    this.init();
    if (this.musicOsc) return;

    const ctx = this.audioCtx!;
    this.musicOsc = ctx.createOscillator();
    this.musicGain = ctx.createGain();

    this.musicOsc.type = "sine";
    this.musicOsc.frequency.setValueAtTime(110, ctx.currentTime);
    
    this.musicGain.gain.setValueAtTime(0, ctx.currentTime);
    this.musicGain.gain.linearRampToValueAtTime(0.02, ctx.currentTime + 2);

    this.musicOsc.connect(this.musicGain);
    this.musicGain.connect(ctx.destination);

    this.musicOsc.start();
  }

  stopMusic() {
    if (this.musicOsc) {
      this.musicOsc.stop();
      this.musicOsc.disconnect();
      this.musicOsc = null;
    }
  }

  playSuccess() {
    if (!this.enabled) return;
    this.init();
    const ctx = this.audioCtx!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  }

  playError() {
    if (!this.enabled) return;
    this.init();
    const ctx = this.audioCtx!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(110, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(55, ctx.currentTime + 0.2);

    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  }

  playClick() {
    if (!this.enabled) return;
    this.init();
    const ctx = this.audioCtx!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(660, ctx.currentTime);

    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  }
}

export const soundManager = typeof window !== "undefined" ? new SoundManager() : null;
