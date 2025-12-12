import {
  Stone,
  Position,
  GameStatus,
  HistoryItem,
  Player,
  GameConfig,
  DEFAULT_BOARD_SIZE,
  DEFAULT_WIN_COUNT
} from '../types/game.js';

/**
 * 五子棋游戏核心类（增强版）
 * 负责游戏逻辑、状态管理和胜负判断
 */
export class Game {
  // 棋盘：二维数组，空位置为 null，黑棋为 'black'，白棋为 'white'
  private board: (Stone | null)[][];
  // 当前玩家
  private currentPlayer: Stone;
  // 游戏状态
  private gameStatus: GameStatus;
  // 获胜位置（用于标记获胜的五个棋子）
  private winningPositions: Position[] | null;
  // 游戏历史记录
  private history: HistoryItem[];
  // 上一步落子位置
  private lastMove: Position | null;
  // 游戏配置
  private config: GameConfig;
  // 玩家信息
  private players: {
    black: Player;
    white: Player;
  };

  constructor(config?: Partial<GameConfig>) {
    // 初始化配置
    this.config = {
      boardSize: DEFAULT_BOARD_SIZE,
      winCount: DEFAULT_WIN_COUNT,
      gameMode: 'pvp',
      difficulty: 'easy',
      ...config
    };

    // 初始化棋盘
    this.board = Array(this.config.boardSize).fill(null)
      .map(() => Array(this.config.boardSize).fill(null));

    this.currentPlayer = 'black';
    this.gameStatus = 'playing';
    this.winningPositions = null;
    this.history = [];
    this.lastMove = null;

    // 初始化玩家信息
    this.players = {
      black: {
        name: this.config.gameMode === 'pve' ? '玩家' : '黑棋玩家',
        stone: 'black',
        timeUsed: 0,
        moveCount: 0
      },
      white: {
        name: this.config.gameMode === 'pve' ? '电脑' : '白棋玩家',
        stone: 'white',
        timeUsed: 0,
        moveCount: 0
      }
    };
  }

  /**
   * 获取游戏配置
   */
  getConfig(): GameConfig {
    return { ...this.config };
  }

  /**
   * 获取当前棋盘状态
   */
  getBoard(): (Stone | null)[][] {
    return this.board.map(row => [...row]);
  }

  /**
   * 获取当前玩家
   */
  getCurrentPlayer(): Stone {
    return this.currentPlayer;
  }

  /**
   * 获取游戏状态
   */
  getGameStatus(): GameStatus {
    return this.gameStatus;
  }

  /**
   * 获取获胜位置
   */
  getWinningPositions(): Position[] | null {
    return this.winningPositions;
  }

  /**
   * 获取历史记录
   */
  getHistory(): HistoryItem[] {
    return [...this.history];
  }

  /**
   * 获取上一步落子位置
   */
  getLastMove(): Position | null {
    return this.lastMove;
  }

  /**
   * 获取玩家信息
   */
  getPlayers(): { black: Player; white: Player } {
    return {
      black: { ...this.players.black },
      white: { ...this.players.white }
    };
  }

  /**
   * 更新玩家信息
   */
  updatePlayerInfo(stone: Stone, info: Partial<Player>): void {
    if (stone === 'black') {
      this.players.black = { ...this.players.black, ...info };
    } else {
      this.players.white = { ...this.players.white, ...info };
    }
  }

  /**
   * 在指定位置落子
   * @param position 落子位置
   * @returns 是否落子成功
   */
  placeStone(position: Position): boolean {
    const { row, col } = position;

    // 检查位置是否有效
    if (!this.isValidPosition(position)) {
      return false;
    }

    // 检查位置是否已被占用
    if (this.board[row][col] !== null) {
      return false;
    }

    // 检查游戏是否已结束
    if (this.gameStatus !== 'playing') {
      return false;
    }

    // 记录历史
    const historyItem: HistoryItem = {
      position,
      stone: this.currentPlayer,
      moveNumber: this.history.length + 1,
      timestamp: Date.now()
    };

    // 落子
    this.board[row][col] = this.currentPlayer;
    this.lastMove = position;
    this.history.push(historyItem);

    // 更新玩家信息
    const player = this.players[this.currentPlayer];
    player.moveCount++;

    // 检查是否获胜
    if (this.checkWin(position)) {
      this.gameStatus = this.currentPlayer === 'black' ? 'blackWin' : 'whiteWin';
    } else if (this.isDraw()) {
      this.gameStatus = 'draw';
    } else {
      // 切换玩家
      this.currentPlayer = this.currentPlayer === 'black' ? 'white' : 'black';
    }

    return true;
  }

  /**
   * 悔棋（撤销上一步）
   * @returns 是否悔棋成功
   */
  undo(): boolean {
    if (this.history.length === 0) {
      return false;
    }

    // 游戏结束后不能悔棋
    if (this.gameStatus !== 'playing') {
      return false;
    }

    // 取出最后一步
    const lastHistoryItem = this.history.pop()!;
    const { position, stone } = lastHistoryItem;

    // 移除棋子
    this.board[position.row][position.col] = null;

    // 更新玩家信息
    this.players[stone].moveCount--;

    // 恢复上一步的状态
    if (this.history.length > 0) {
      const prevHistoryItem = this.history[this.history.length - 1];
      this.lastMove = prevHistoryItem.position;
      this.currentPlayer = stone;
    } else {
      this.lastMove = null;
      this.currentPlayer = 'black';
    }

    return true;
  }

  /**
   * 检查位置是否有效
   */
  private isValidPosition(position: Position): boolean {
    const { row, col } = position;
    return row >= 0 && row < this.config.boardSize &&
           col >= 0 && col < this.config.boardSize;
  }

  /**
   * 检查是否获胜
   */
  private checkWin(lastPosition: Position): boolean {
    const { row, col } = lastPosition;
    const stone = this.board[row][col]!;

    // 四个方向：水平、垂直、两个对角线
    const directions = [
      [[0, 1], [0, -1]],   // 水平
      [[1, 0], [-1, 0]],   // 垂直
      [[1, 1], [-1, -1]],  // 主对角线
      [[1, -1], [-1, 1]]   // 副对角线
    ];

    // 检查每个方向
    for (const direction of directions) {
      const positions: Position[] = [{ row, col }];
      let count = 1;

      // 检查两个相反方向
      for (const [dr, dc] of direction) {
        let r = row + dr;
        let c = col + dc;

        // 沿着方向查找相同颜色的棋子
        while (
          r >= 0 && r < this.config.boardSize &&
          c >= 0 && c < this.config.boardSize &&
          this.board[r][c] === stone
        ) {
          positions.push({ row: r, col: c });
          count++;
          r += dr;
          c += dc;
        }
      }

      // 如果找到足够的连续棋子，则获胜
      if (count >= this.config.winCount) {
        this.winningPositions = positions;
        return true;
      }
    }

    return false;
  }

  /**
   * 检查是否平局
   */
  private isDraw(): boolean {
    // 检查棋盘是否已满
    for (let row = 0; row < this.config.boardSize; row++) {
      for (let col = 0; col < this.config.boardSize; col++) {
        if (this.board[row][col] === null) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * 重新开始游戏
   */
  reset(): void {
    this.board = Array(this.config.boardSize).fill(null)
      .map(() => Array(this.config.boardSize).fill(null));
    this.currentPlayer = 'black';
    this.gameStatus = 'playing';
    this.winningPositions = null;
    this.history = [];
    this.lastMove = null;

    // 重置玩家信息
    this.players.black.timeUsed = 0;
    this.players.black.moveCount = 0;
    this.players.white.timeUsed = 0;
    this.players.white.moveCount = 0;
  }

  /**
   * 获取所有空位置
   */
  getEmptyPositions(): Position[] {
    const emptyPositions: Position[] = [];
    for (let row = 0; row < this.config.boardSize; row++) {
      for (let col = 0; col < this.config.boardSize; col++) {
        if (this.board[row][col] === null) {
          emptyPositions.push({ row, col });
        }
      }
    }
    return emptyPositions;
  }

  /**
   * 设置游戏状态
   */
  setGameStatus(status: GameStatus): void {
    this.gameStatus = status;
  }
}