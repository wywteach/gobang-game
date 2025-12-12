/**
 * 游戏计时器
 * 负责管理玩家的思考时间
 */
export class Timer {
  private startTime: number | null = null;
  private elapsedTime: number = 0;
  private intervalId: number | null = null;
  private onTimeUpdate: ((time: number) => void) | null = null;
  private onTimeOut: (() => void) | null = null;
  private timeLimit: number = 0; // 时间限制（毫秒），0表示无限制

  /**
   * 设置时间限制
   */
  setTimeLimit(limit: number): void {
    this.timeLimit = limit;
  }

  /**
   * 设置时间更新回调
   */
  setOnTimeUpdate(callback: (time: number) => void): void {
    this.onTimeUpdate = callback;
  }

  /**
   * 设置超时回调
   */
  setOnTimeOut(callback: () => void): void {
    this.onTimeOut = callback;
  }

  /**
   * 开始计时
   */
  start(): void {
    if (this.intervalId) return;

    this.startTime = Date.now();
    this.intervalId = window.setInterval(() => {
      this.update();
    }, 100); // 每100毫秒更新一次
  }

  /**
   * 暂停计时
   */
  pause(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * 重置计时器
   */
  reset(): void {
    this.pause();
    this.startTime = null;
    this.elapsedTime = 0;
    if (this.onTimeUpdate) {
      this.onTimeUpdate(0);
    }
  }

  /**
   * 获取当前已用时间（毫秒）
   */
  getTime(): number {
    if (this.startTime) {
      return this.elapsedTime + (Date.now() - this.startTime);
    }
    return this.elapsedTime;
  }

  /**
   * 获取剩余时间（毫秒）
   */
  getRemainingTime(): number {
    if (this.timeLimit === 0) return 0;
    return Math.max(0, this.timeLimit - this.getTime());
  }

  /**
   * 获取格式化的时间字符串
   */
  getFormattedTime(): string {
    const time = this.getTime();
    const minutes = Math.floor(time / 60000);
    const seconds = Math.floor((time % 60000) / 1000);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * 获取格式化的剩余时间字符串
   */
  getFormattedRemainingTime(): string {
    const remaining = this.getRemainingTime();
    if (remaining === 0) return '--:--';

    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * 更新计时器
   */
  private update(): void {
    const currentTime = this.getTime();

    // 触发时间更新回调
    if (this.onTimeUpdate) {
      this.onTimeUpdate(currentTime);
    }

    // 检查是否超时
    if (this.timeLimit > 0 && currentTime >= this.timeLimit) {
      this.pause();
      if (this.onTimeOut) {
        this.onTimeOut();
      }
    }
  }

  /**
   * 切换计时器状态（开始/暂停）
   */
  toggle(): void {
    if (this.intervalId) {
      this.pause();
    } else {
      this.start();
    }
  }

  /**
   * 销毁计时器
   */
  destroy(): void {
    this.pause();
    this.onTimeUpdate = null;
    this.onTimeOut = null;
  }
}