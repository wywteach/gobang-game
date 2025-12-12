/**
 * 游戏类型定义
 */

// 棋子类型：黑棋或白棋
export type Stone = 'black' | 'white';

// 棋盘位置
export interface Position {
  row: number;
  col: number;
}

// 游戏模式
export type GameMode = 'pvp' | 'pve';  // 玩家对战 或 人机对战

// 游戏状态
export type GameStatus = 'playing' | 'blackWin' | 'whiteWin' | 'draw' | 'paused';

// 游戏难度（仅对AI有效）
export type GameDifficulty = 'easy' | 'normal' | 'hard';

// 历史记录项
export interface HistoryItem {
  position: Position;
  stone: Stone;
  moveNumber: number;
  timestamp: number;
}

// 玩家信息
export interface Player {
  name: string;
  stone: Stone;
  timeUsed: number;  // 已用时间（毫秒）
  moveCount: number; // 落子数
}

// 游戏配置
export interface GameConfig {
  boardSize: number;
  winCount: number;
  gameMode: GameMode;
  difficulty?: GameDifficulty;
  timeLimit?: number; // 时间限制（毫秒），0表示无限制
}

// 棋盘大小配置
export const DEFAULT_BOARD_SIZE = 15;

// 获胜所需的连续棋子数
export const DEFAULT_WIN_COUNT = 5;

// 声音类型
export type SoundType = 'place' | 'win' | 'lose' | 'button' | 'undo';