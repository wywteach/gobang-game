import { SoundType } from '../types/game.js';

/**
 * 音效管理器
 * 负责游戏中的各种音效播放
 */
export class SoundManager {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;
  private volume: number = 0.5;
  private initError: boolean = false;

  constructor() {
    try {
      // 创建音频上下文
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.error('音频上下文创建失败:', error);
      this.initError = true;
      this.enabled = false;
    }
  }

  /**
   * 设置音效开关
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * 设置音量
   */
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  /**
   * 播放音效
   */
  playSound(type: SoundType): void {
    if (!this.enabled || !this.audioContext || this.initError) return;

    switch (type) {
      case 'place':
        this.playPlaceSound();
        break;
      case 'win':
        this.playWinSound();
        break;
      case 'lose':
        this.playLoseSound();
        break;
      case 'button':
        this.playButtonSound();
        break;
      case 'undo':
        this.playUndoSound();
        break;
    }
  }

  /**
   * 落子音效
   */
  private playPlaceSound(): void {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.value = 600;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(this.volume * 0.3, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.1);
  }

  /**
   * 获胜音效
   */
  private playWinSound(): void {
    if (!this.audioContext) return;

    const notes = [523, 659, 784, 1047]; // C, E, G, High C
    notes.forEach((frequency, index) => {
      setTimeout(() => {
        const oscillator = this.audioContext!.createOscillator();
        const gainNode = this.audioContext!.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext!.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(this.volume * 0.4, this.audioContext!.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext!.currentTime + 0.5);

        oscillator.start(this.audioContext!.currentTime);
        oscillator.stop(this.audioContext!.currentTime + 0.5);
      }, index * 100);
    });
  }

  /**
   * 失败音效
   */
  private playLoseSound(): void {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.5);
    oscillator.type = 'sawtooth';

    gainNode.gain.setValueAtTime(this.volume * 0.3, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.5);
  }

  /**
   * 按钮点击音效
   */
  private playButtonSound(): void {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'square';

    gainNode.gain.setValueAtTime(this.volume * 0.1, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.05);
  }

  /**
   * 悔棋音效
   */
  private playUndoSound(): void {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.value = 300;
    oscillator.type = 'triangle';

    gainNode.gain.setValueAtTime(this.volume * 0.2, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.2);
  }
}