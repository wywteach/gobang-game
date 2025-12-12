import { Game } from './core/Game.js';
import { AI } from './core/AI.js';
import { Timer } from './utils/Timer.js';
import { SoundManager } from './utils/SoundManager.js';
import {
  Position,
  GameMode,
  GameStatus,
  GameConfig,
  HistoryItem
} from './types/game.js';

/**
 * 游戏UI控制器（增强版）
 * 负责游戏界面与用户交互
 */
class GameController {
  private game: Game;
  private ai: AI | null = null;
  private soundManager: SoundManager;
  private blackTimer: Timer;
  private whiteTimer: Timer;
  private gameTimer: Timer;

  // 游戏配置
  private settings: {
    showCoordinates: boolean;
    showLastMove: boolean;
    enableAnimations: boolean;
    soundEnabled: boolean;
    currentTheme: string;
  };

  // 游戏统计
  private statistics: {
    totalGames: number;
    blackWins: number;
    whiteWins: number;
    draws: number;
  };

  // 复盘模式
  private isReviewMode: boolean = false;
  private reviewHistory: HistoryItem[] = [];
  private reviewIndex: number = 0;

  constructor() {
    // 初始化游戏配置
    this.settings = {
      showCoordinates: true,
      showLastMove: true,
      enableAnimations: true,
      soundEnabled: true,
      currentTheme: 'default'
    };

    // 初始化统计
    this.statistics = {
      totalGames: 0,
      blackWins: 0,
      whiteWins: 0,
      draws: 0
    };

    // 初始化游戏
    this.game = new Game();

    // 初始化音效管理器
    this.soundManager = new SoundManager();
    this.soundManager.setEnabled(this.settings.soundEnabled);

    // 初始化计时器
    this.blackTimer = new Timer();
    this.whiteTimer = new Timer();
    this.gameTimer = new Timer();

    // 初始化游戏
    this.init();
  }

  /**
   * 初始化游戏
   */
  private async init(): Promise<void> {
    // 创建棋盘
    this.createBoard();

    // 设置计时器
    this.setupTimers();

    // 绑定事件
    this.bindEvents();

    // 绑定键盘快捷键
    this.bindKeyboardEvents();

    // 更新UI
    this.updateUI();
    this.updateStatistics();
    this.applyTheme(this.settings.currentTheme);
  }

  /**
   * 创建棋盘
   */
  private createBoard(): void {
    const config = this.game.getConfig();
    const boardElement = document.getElementById('board');

    if (!boardElement) {
      console.error('无法找到棋盘元素');
      return;
    }

    // 设置棋盘网格
    boardElement.innerHTML = '';
    boardElement.style.gridTemplateColumns = `repeat(${config.boardSize}, 36px)`;
    boardElement.style.gridTemplateRows = `repeat(${config.boardSize}, 36px)`;

    // 创建棋盘格子
    for (let row = 0; row < config.boardSize; row++) {
      for (let col = 0; col < config.boardSize; col++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.row = row.toString();
        cell.dataset.col = col.toString();

        // 添加坐标标签
        if (this.settings.showCoordinates) {
          this.addCoordinates(row, col, cell);
        }

        // 添加点击事件
        cell.addEventListener('click', () => {
          this.handleCellClick(row, col);
        });

        boardElement.appendChild(cell);
      }
    }
  }

  /**
   * 添加坐标标签
   */
  private addCoordinates(row: number, col: number, cell: HTMLElement): void {
    const config = this.game.getConfig();

    if (row === 0) {
      const topLabel = document.createElement('span');
      topLabel.className = 'coord-label';
      topLabel.textContent = String.fromCharCode(65 + col);
      topLabel.style.cssText = `
        position: absolute;
        top: -20px;
        left: 50%;
        transform: translateX(-50%);
        font-size: 12px;
        color: var(--board-line);
        pointer-events: none;
      `;
      cell.appendChild(topLabel);
    }

    if (col === 0) {
      const leftLabel = document.createElement('span');
      leftLabel.className = 'coord-label';
      leftLabel.textContent = (config.boardSize - row).toString();
      leftLabel.style.cssText = `
        position: absolute;
        left: -20px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 12px;
        color: var(--board-line);
        pointer-events: none;
      `;
      cell.appendChild(leftLabel);
    }
  }

  /**
   * 设置计时器
   */
  private setupTimers(): void {
    // 黑棋计时器
    this.blackTimer.setOnTimeUpdate((time) => {
      const element = document.getElementById('black-time')!;
      element.textContent = this.formatTime(time);
      this.game.updatePlayerInfo('black', { timeUsed: time });
    });

    // 白棋计时器
    this.whiteTimer.setOnTimeUpdate((time) => {
      const element = document.getElementById('white-time')!;
      element.textContent = this.formatTime(time);
      this.game.updatePlayerInfo('white', { timeUsed: time });
    });

    // 游戏总计时器
    this.gameTimer.setOnTimeUpdate((time) => {
      const element = document.getElementById('game-timer-text')!;
      element.textContent = this.formatTime(time);
    });
  }

  /**
   * 绑定事件监听器
   */
  private bindEvents(): void {
    // 控制按钮
    document.getElementById('new-game-btn')!.addEventListener('click', () => {
      this.resetGame();
    });

    document.getElementById('undo-btn')!.addEventListener('click', () => {
      this.undoMove();
    });

    document.getElementById('pause-btn')!.addEventListener('click', () => {
      this.togglePause();
    });

    document.getElementById('sound-btn')!.addEventListener('click', () => {
      this.toggleSound();
    });

    // 头部按钮
    document.getElementById('settings-btn')!.addEventListener('click', () => {
      this.openModal('settings-modal');
    });

    document.getElementById('theme-btn')!.addEventListener('click', () => {
      this.openModal('theme-modal');
    });

    // 设置弹窗控制
    document.getElementById('settings-close')!.addEventListener('click', () => {
      this.closeModal('settings-modal');
    });

    document.getElementById('settings-save')!.addEventListener('click', () => {
      this.saveSettings();
    });

    document.getElementById('settings-reset')!.addEventListener('click', () => {
      this.resetSettings();
    });

    // 主题弹窗控制
    document.getElementById('theme-close')!.addEventListener('click', () => {
      this.closeModal('theme-modal');
    });

    // 主题选择
    const themeCards = document.querySelectorAll('.theme-card');
    themeCards.forEach((card: Element) => {
      card.addEventListener('click', () => {
        const theme = (card as HTMLElement).dataset.theme || 'default';
        this.selectTheme(theme);
      });
    });

    // 游戏模式切换
    const modeButtons = document.querySelectorAll('.mode-btn');
    modeButtons.forEach((btn: Element) => {
      btn.addEventListener('click', () => {
        const mode = (btn as HTMLElement).dataset.mode as GameMode;
        this.switchGameMode(mode);
      });
    });

    // 弹窗控制
    document.getElementById('modal-close')!.addEventListener('click', () => {
      this.closeModal('game-modal');
    });

    document.getElementById('modal-new-game')!.addEventListener('click', () => {
      this.closeModal('game-modal');
      this.resetGame();
    });

    document.getElementById('modal-review')!.addEventListener('click', () => {
      this.startReview();
    });
  }

  /**
   * 处理棋盘格子点击
   */
  private handleCellClick(row: number, col: number): void {
    const position: Position = { row, col };

    // 检查是否是AI回合
    if (this.ai && this.game.getCurrentPlayer() === 'white') {
      return;
    }

    // 尝试落子
    const success = this.game.placeStone(position);

    if (success) {
      // 播放落子音效
      this.soundManager.playSound('place');

      // 更新UI
      this.updateBoard();
      this.updateUI();
      this.updateHistory();

      // 检查游戏是否结束
      const gameStatus = this.game.getGameStatus();
      if (gameStatus !== 'playing') {
        this.handleGameEnd(gameStatus);
      } else if (this.ai && this.game.getCurrentPlayer() === 'white') {
        // AI回合
        this.makeAIMove();
      }
    }
  }

  /**
   * AI落子
   */
  private async makeAIMove(): Promise<void> {
    // 延迟一下，让玩家看清楚
    await this.delay(500);

    const position = this.ai!.getNextMove();
    if (position) {
      const success = this.game.placeStone(position);

      if (success) {
        // 播放落子音效
        this.soundManager.playSound('place');

        // 更新UI
        this.updateBoard();
        this.updateUI();
        this.updateHistory();

        // 检查游戏是否结束
        const gameStatus = this.game.getGameStatus();
        if (gameStatus !== 'playing') {
          this.handleGameEnd(gameStatus);
        }
      }
    }
  }

  /**
   * 更新棋盘显示
   */
  private updateBoard(): void {
    const board = this.game.getBoard();
    const lastMove = this.game.getLastMove();
    const cells = document.querySelectorAll('.cell');

    cells.forEach((cell) => {
      const element = cell as HTMLElement;
      const row = parseInt(element.dataset.row!);
      const col = parseInt(element.dataset.col!);
      const stone = board[row][col];

      // 移除旧的棋子
      const oldStone = cell.querySelector('.stone');
      if (oldStone) {
        oldStone.remove();
      }

      // 移除旧的特殊标记
      element.classList.remove('last-move');

      // 添加棋子
      if (stone) {
        const stoneElement = document.createElement('div');
        stoneElement.className = `stone ${stone}`;
        cell.appendChild(stoneElement);

        // 标记最后落子
        if (lastMove && lastMove.row === row && lastMove.col === col) {
          if (this.settings.showLastMove) {
            element.classList.add('last-move');
          }
        }
      }
    });

    // 高亮获胜棋子
    const winningPositions = this.game.getWinningPositions();
    if (winningPositions) {
      this.highlightWinningStones(winningPositions);
    }
  }

  /**
   * 高亮获胜的棋子
   */
  private highlightWinningStones(positions: Position[]): void {
    positions.forEach(({ row, col }) => {
      const cell = this.getCellElement(row, col);
      if (cell) {
        const stone = cell.querySelector('.stone');
        if (stone) {
          stone.classList.add('winning');
        }
      }
    });
  }

  /**
   * 获取指定位置的棋盘格子元素
   */
  private getCellElement(row: number, col: number): HTMLElement | null {
    return document.querySelector(`[data-row="${row}"][data-col="${col}"]`) as HTMLElement | null;
  }

  /**
   * 更新UI显示
   */
  private updateUI(): void {
    const currentPlayer = this.game.getCurrentPlayer();
    const gameStatus = this.game.getGameStatus();
    const players = this.game.getPlayers();

    // 更新玩家信息
    const blackPlayerName = document.getElementById('black-player-name')!;
    const whitePlayerName = document.getElementById('white-player-name')!;
    const blackMoves = document.getElementById('black-moves')!;
    const whiteMoves = document.getElementById('white-moves')!;

    blackPlayerName.textContent = players.black.name;
    whitePlayerName.textContent = players.white.name;
    blackMoves.textContent = players.black.moveCount.toString();
    whiteMoves.textContent = players.white.moveCount.toString();

    // 更新当前玩家指示
    const blackPlayer = document.querySelector('.black-player') as HTMLElement;
    const whitePlayer = document.querySelector('.white-player') as HTMLElement;

    if (gameStatus === 'playing') {
      if (currentPlayer === 'black') {
        blackPlayer.classList.add('active');
        whitePlayer.classList.remove('active');
      } else {
        blackPlayer.classList.remove('active');
        whitePlayer.classList.add('active');
      }
    }

    // 更新状态文本
    const gameStatusText = document.getElementById('game-status-text')!;
    if (gameStatus === 'playing') {
      gameStatusText.textContent =
        this.ai ? `${currentPlayer === 'black' ? '玩家' : '电脑'}回合` :
        `${currentPlayer === 'black' ? '黑棋' : '白棋'}回合`;
    } else if (gameStatus === 'paused') {
      gameStatusText.textContent = '游戏已暂停';
    }

    // 更新按钮状态
    const undoBtn = document.getElementById('undo-btn') as HTMLButtonElement;
    const pauseBtn = document.getElementById('pause-btn') as HTMLButtonElement;

    undoBtn.disabled = this.game.getHistory().length === 0 || gameStatus !== 'playing';
    pauseBtn.disabled = gameStatus === 'blackWin' || gameStatus === 'whiteWin' || gameStatus === 'draw';
  }

  /**
   * 更新历史记录
   */
  private updateHistory(): void {
    const history = this.game.getHistory();
    const historyList = document.getElementById('history-list')!;

    if (history.length === 0) {
      historyList.innerHTML = '<p class="empty-history">暂无落子记录</p>';
      return;
    }

    historyList.innerHTML = '';
    history.slice(-10).reverse().forEach(item => {
      const historyItem = document.createElement('div');
      historyItem.className = 'history-item';

      const col = item.position.col;
      const row = item.position.row;
      const boardSize = this.game.getConfig().boardSize;

      historyItem.innerHTML = `
        <div class="history-number">${item.moveNumber}</div>
        <div class="history-stone ${item.stone}"></div>
        <div class="history-position">${String.fromCharCode(65 + col)}${boardSize - row}</div>
      `;

      historyList.appendChild(historyItem);
    });
  }

  /**
   * 更新统计信息
   */
  private updateStatistics(): void {
    document.getElementById('total-games')!.textContent = this.statistics.totalGames.toString();
    document.getElementById('black-wins')!.textContent = this.statistics.blackWins.toString();
    document.getElementById('white-wins')!.textContent = this.statistics.whiteWins.toString();
    document.getElementById('draws')!.textContent = this.statistics.draws.toString();
  }

  /**
   * 处理游戏结束
   */
  private handleGameEnd(status: GameStatus): void {
    // 停止计时器
    this.blackTimer.pause();
    this.whiteTimer.pause();
    this.gameTimer.pause();

    // 更新统计
    this.statistics.totalGames++;
    if (status === 'blackWin') {
      this.statistics.blackWins++;
      this.soundManager.playSound('win');
    } else if (status === 'whiteWin') {
      this.statistics.whiteWins++;
      this.soundManager.playSound(this.ai ? 'lose' : 'win');
    } else {
      this.statistics.draws++;
    }

    // 显示结果弹窗
    this.showGameResult(status);
  }

  /**
   * 显示游戏结果
   */
  private showGameResult(status: GameStatus): void {
    let message = '';

    switch (status) {
      case 'blackWin':
        message = this.ai ? '恭喜你获胜！' : '黑棋获胜！';
        break;
      case 'whiteWin':
        message = this.ai ? '电脑获胜！' : '白棋获胜！';
        break;
      case 'draw':
        message = '平局！';
        break;
    }

    const modalTitle = document.getElementById('modal-title')!;
    const modalMessage = document.getElementById('modal-message')!;

    modalTitle.innerHTML = '<i class="fas fa-trophy"></i> 游戏结束';
    modalMessage.textContent = message;

    this.openModal('game-modal');
  }

  /**
   * 切换游戏模式
   */
  private switchGameMode(mode: GameMode): void {
    // 更新按钮状态
    const modeButtons = document.querySelectorAll('.mode-btn');
    modeButtons.forEach((btn: Element) => {
      (btn as HTMLElement).classList.toggle('active',
        (btn as HTMLElement).dataset.mode === mode);
    });

    // 重新开始游戏
    this.resetGame(mode);
  }

  /**
   * 重置游戏
   */
  private resetGame(mode?: GameMode): void {
    // 获取当前配置
    const currentConfig = this.game.getConfig();
    const newConfig: Partial<GameConfig> = {
      gameMode: mode || currentConfig.gameMode
    };

    // 重新创建游戏
    this.game = new Game(newConfig);

    // 重新创建AI
    if (newConfig.gameMode === 'pve' || (mode && mode === 'pve')) {
      this.ai = new AI(this.game, 'white', 'normal');
    } else {
      this.ai = null;
    }

    // 重置计时器
    this.blackTimer.reset();
    this.whiteTimer.reset();
    this.gameTimer.reset();

    // 重新创建棋盘
    this.createBoard();

    // 更新UI
    this.updateUI();
    this.updateHistory();
    this.updateStatistics();
  }

  /**
   * 悔棋
   */
  private undoMove(): void {
    const success = this.game.undo();

    if (success) {
      this.soundManager.playSound('undo');

      // 如果是AI模式，需要再撤销一步
      if (this.ai && this.game.getHistory().length > 0) {
        this.game.undo();
      }

      this.updateBoard();
      this.updateUI();
      this.updateHistory();
    }
  }

  /**
   * 暂停/继续游戏
   */
  private togglePause(): void {
    const currentStatus = this.game.getGameStatus();

    if (currentStatus === 'playing') {
      this.game.setGameStatus('paused');
      this.blackTimer.pause();
      this.whiteTimer.pause();
      this.gameTimer.pause();

      const pauseBtn = document.getElementById('pause-btn') as HTMLButtonElement;
      pauseBtn.innerHTML = '<i class="fas fa-play"></i> 继续';
    } else if (currentStatus === 'paused') {
      this.game.setGameStatus('playing');
      this.blackTimer.start();
      this.whiteTimer.start();
      this.gameTimer.start();

      const pauseBtn = document.getElementById('pause-btn') as HTMLButtonElement;
      pauseBtn.innerHTML = '<i class="fas fa-pause"></i> 暂停';
    }

    this.updateUI();
  }

  /**
   * 切换音效
   */
  private toggleSound(): void {
    this.settings.soundEnabled = !this.settings.soundEnabled;
    this.soundManager.setEnabled(this.settings.soundEnabled);

    const soundBtn = document.getElementById('sound-btn') as HTMLButtonElement;
    soundBtn.innerHTML = this.settings.soundEnabled ?
      '<i class="fas fa-volume-up"></i>' :
      '<i class="fas fa-volume-mute"></i>';

    this.soundManager.playSound('button');
  }

  /**
   * 打开弹窗
   */
  private openModal(modalId: string): void {
    const modal = document.getElementById(modalId)!;
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
  }

  /**
   * 关闭弹窗
   */
  private closeModal(modalId: string): void {
    const modal = document.getElementById(modalId)!;
    modal.classList.remove('show');
    document.body.style.overflow = '';
  }

  /**
   * 格式化时间
   */
  private formatTime(ms: number): string {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 应用主题
   */
  private applyTheme(theme: string): void {
    document.body.setAttribute('data-theme', theme);
  }

  /**
   * 保存设置
   */
  private saveSettings(): void {
    // 获取设置值
    const boardSize = parseInt((document.getElementById('board-size') as HTMLSelectElement).value);
    const winCount = parseInt((document.getElementById('win-count') as HTMLSelectElement).value);
    const aiDifficulty = (document.getElementById('ai-difficulty') as HTMLSelectElement).value as 'easy' | 'normal' | 'hard';
    const timeLimit = parseInt((document.getElementById('time-limit') as HTMLSelectElement).value);

    // 更新本地设置
    this.settings.showCoordinates = (document.getElementById('show-coordinates') as HTMLInputElement).checked;
    this.settings.showLastMove = (document.getElementById('show-last-move') as HTMLInputElement).checked;
    this.settings.enableAnimations = (document.getElementById('enable-animations') as HTMLInputElement).checked;

    // 应用新配置并重新开始游戏
    const newConfig = {
      boardSize,
      winCount,
      gameMode: this.game.getConfig().gameMode,
      difficulty: aiDifficulty,
      timeLimit
    };

    this.resetGame(newConfig.gameMode);
    this.closeModal('settings-modal');

    // 重新创建棋盘
    this.createBoard();
  }

  /**
   * 重置设置
   */
  private resetSettings(): void {
    // 恢复默认值
    (document.getElementById('board-size') as HTMLSelectElement).value = '15';
    (document.getElementById('win-count') as HTMLSelectElement).value = '5';
    (document.getElementById('ai-difficulty') as HTMLSelectElement).value = 'normal';
    (document.getElementById('time-limit') as HTMLSelectElement).value = '0';
    (document.getElementById('show-coordinates') as HTMLInputElement).checked = true;
    (document.getElementById('show-last-move') as HTMLInputElement).checked = true;
    (document.getElementById('enable-animations') as HTMLInputElement).checked = true;
  }

  /**
   * 选择主题
   */
  private selectTheme(theme: string): void {
    // 更新主题卡片状态
    const themeCards = document.querySelectorAll('.theme-card');
    themeCards.forEach((card: Element) => {
      (card as HTMLElement).classList.toggle('active', (card as HTMLElement).dataset.theme === theme);
    });

    // 应用主题
    this.settings.currentTheme = theme;
    this.applyTheme(theme);
    this.closeModal('theme-modal');
  }

  /**
   * 开始复盘
   */
  private startReview(): void {
    const history = this.game.getHistory();
    if (history.length === 0) {
      alert('没有可复盘的内容');
      return;
    }

    // 保存当前游戏状态
    this.reviewHistory = [...history];
    this.reviewIndex = 0;
    this.isReviewMode = true;

    // 关闭游戏结束弹窗
    this.closeModal('game-modal');

    // 重置棋盘显示
    const board = this.game.getBoard();
    for (let row = 0; row < board.length; row++) {
      for (let col = 0; col < board[row].length; col++) {
        board[row][col] = null;
      }
    }

    // 更新棋盘显示
    this.updateBoard();
    this.updateUI();

    // 显示复盘控制提示
    this.showReviewControls();
  }

  /**
   * 显示复盘控制
   */
  private showReviewControls(): void {
    const statusText = document.getElementById('game-status-text')!;
    statusText.innerHTML = `
      <div class="review-controls">
        <span>复盘模式 - 步骤 ${this.reviewIndex}/${this.reviewHistory.length}</span>
        <div class="review-buttons">
          <button onclick="gameController.prevStep()" class="review-btn">
            <i class="fas fa-step-backward"></i> 上一步
          </button>
          <button onclick="gameController.nextStep()" class="review-btn">
            <i class="fas fa-step-forward"></i> 下一步
          </button>
          <button onclick="gameController.exitReview()" class="review-btn">
            <i class="fas fa-times"></i> 退出复盘
          </button>
        </div>
      </div>
    `;
  }

  /**
   * 上一步
   */
  private prevStep(): void {
    if (this.reviewIndex > 0) {
      this.reviewIndex--;
      this.replayToStep();
    }
  }

  /**
   * 下一步
   */
  private nextStep(): void {
    if (this.reviewIndex < this.reviewHistory.length) {
      this.reviewIndex++;
      this.replayToStep();
    }
  }

  /**
   * 重放到指定步骤
   */
  private replayToStep(): void {
    // 清空棋盘
    const board = this.game.getBoard();
    for (let row = 0; row < board.length; row++) {
      for (let col = 0; col < board[row].length; col++) {
        board[row][col] = null;
      }
    }

    // 重新放置棋子到当前步骤
    for (let i = 0; i < this.reviewIndex; i++) {
      const item = this.reviewHistory[i];
      board[item.position.row][item.position.col] = item.stone;
    }

    // 更新最后一步标记
    if (this.reviewIndex > 0) {
      const lastItem = this.reviewHistory[this.reviewIndex - 1];
      this.game['lastMove'] = lastItem.position;
    } else {
      this.game['lastMove'] = null;
    }

    // 更新显示
    this.updateBoard();
    this.showReviewControls();
  }

  /**
   * 退出复盘
   */
  private exitReview(): void {
    this.isReviewMode = false;
    this.reviewHistory = [];
    this.reviewIndex = 0;

    // 恢复游戏状态
    const history = this.game.getHistory();
    const board = this.game.getBoard();

    // 清空棋盘
    for (let row = 0; row < board.length; row++) {
      for (let col = 0; col < board[row].length; col++) {
        board[row][col] = null;
      }
    }

    // 恢复所有棋子
    history.forEach(item => {
      board[item.position.row][item.position.col] = item.stone;
    });

    // 更新显示
    this.updateBoard();
    this.updateUI();
  }

  /**
   * 绑定键盘快捷键
   */
  private bindKeyboardEvents(): void {
    document.addEventListener('keydown', (e) => {
      // 防止在输入框中触发快捷键
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA') {
        return;
      }

      // 复盘模式的快捷键
      if (this.isReviewMode) {
        switch (e.key.toLowerCase()) {
          case 'arrowleft':
            e.preventDefault();
            this.prevStep();
            break;
          case 'arrowright':
            e.preventDefault();
            this.nextStep();
            break;
          case 'escape':
            e.preventDefault();
            this.exitReview();
            break;
        }
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'z':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            this.undoMove();
          }
          break;
        case 'n':
          e.preventDefault();
          this.resetGame();
          break;
        case 'p':
          e.preventDefault();
          this.togglePause();
          break;
        case 's':
          e.preventDefault();
          this.toggleSound();
          break;
        case 'escape':
          e.preventDefault();
          // 关闭所有弹窗
          this.closeModal('game-modal');
          this.closeModal('settings-modal');
          this.closeModal('theme-modal');
          break;
      }
    });
  }
}

// 创建全局实例以供复盘按钮使用
export let gameController: GameController;

// 当DOM加载完成后启动游戏
document.addEventListener('DOMContentLoaded', () => {
  gameController = new GameController();
});