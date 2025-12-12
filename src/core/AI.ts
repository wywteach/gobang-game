import { Game } from './Game.js';
import { Stone, Position, GameDifficulty } from '../types/game.js';

/**
 * AI对手类
 * 实现简单的人机对战功能
 */
export class AI {
  private game: Game;
  private difficulty: GameDifficulty;
  private aiStone: Stone;

  constructor(game: Game, aiStone: Stone = 'white', difficulty: GameDifficulty = 'easy') {
    this.game = game;
    this.aiStone = aiStone;
    this.difficulty = difficulty;
  }

  /**
   * 设置AI难度
   */
  setDifficulty(difficulty: GameDifficulty): void {
    this.difficulty = difficulty;
  }

  /**
   * 获取AI的下一步落子位置
   */
  getNextMove(): Position | null {
    const board = this.game.getBoard();
    const emptyPositions = this.game.getEmptyPositions();

    if (emptyPositions.length === 0) {
      return null;
    }

    // 第一步通常下在棋盘中心
    if (emptyPositions.length === board.length * board.length) {
      const center = Math.floor(board.length / 2);
      return { row: center, col: center };
    }

    switch (this.difficulty) {
      case 'easy':
        return this.getRandomMove(emptyPositions);
      case 'normal':
        return this.getNormalMove(board, emptyPositions);
      case 'hard':
        return this.getHardMove(board, emptyPositions);
      default:
        return this.getRandomMove(emptyPositions);
    }
  }

  /**
   * 随机落子（简单难度）
   */
  private getRandomMove(emptyPositions: Position[]): Position {
    const randomIndex = Math.floor(Math.random() * emptyPositions.length);
    return emptyPositions[randomIndex];
  }

  /**
   * 普通难度：优先防守，其次进攻
   */
  private getNormalMove(board: (Stone | null)[][], emptyPositions: Position[]): Position {
    const config = this.game.getConfig();

    // 创建棋盘副本以安全地模拟落子
    const boardCopy = this.createBoardCopy(board);

    // 首先检查是否能直接获胜
    for (const pos of emptyPositions) {
      boardCopy[pos.row][pos.col] = this.aiStone;
      if (this.checkWinAt(boardCopy, pos, this.aiStone, config.winCount)) {
        return pos;
      }
      boardCopy[pos.row][pos.col] = null;
    }

    // 然后检查是否需要阻止对手获胜
    const opponentStone = this.aiStone === 'black' ? 'white' : 'black';
    for (const pos of emptyPositions) {
      boardCopy[pos.row][pos.col] = opponentStone;
      if (this.checkWinAt(boardCopy, pos, opponentStone, config.winCount)) {
        return pos;
      }
      boardCopy[pos.row][pos.col] = null;
    }

    // 寻找最佳防守和进攻位置
    let bestScore = -Infinity;
    let bestMove = emptyPositions[0];

    for (const pos of emptyPositions) {
      let score = 0;

      // 评估此位置的价值
      score += this.evaluatePosition(board, pos, this.aiStone);
      score -= this.evaluatePosition(board, pos, opponentStone);

      // 偏好中心位置
      const centerDistance = Math.abs(pos.row - board.length / 2) + Math.abs(pos.col - board.length / 2);
      score -= centerDistance * 0.1;

      if (score > bestScore) {
        bestScore = score;
        bestMove = pos;
      }
    }

    return bestMove;
  }

  /**
   * 困难难度：使用更智能的评估
   */
  private getHardMove(board: (Stone | null)[][], emptyPositions: Position[]): Position {
    // 使用极大极小算法的简化版本
    let bestMove = this.getNormalMove(board, emptyPositions);

    // 在关键情况下进行更深入的搜索
    const winningMoves = this.findWinningMoves(board, emptyPositions);
    const blockingMoves = this.findBlockingMoves(board, emptyPositions);

    if (winningMoves.length > 0) {
      return winningMoves[0];
    }

    if (blockingMoves.length > 0) {
      return blockingMoves[0];
    }

    return bestMove;
  }

  /**
   * 评估位置分数
   */
  private evaluatePosition(board: (Stone | null)[][], position: Position, stone: Stone): number {
    const { row, col } = position;
    let score = 0;
    const directions = [
      [[0, 1], [0, -1]],   // 水平
      [[1, 0], [-1, 0]],   // 垂直
      [[1, 1], [-1, -1]],  // 主对角线
      [[1, -1], [-1, 1]]   // 副对角线
    ];

    for (const direction of directions) {
      let count = 1;
      let openEnds = 0;

      // 检查两个方向
      for (const [dr, dc] of direction) {
        let r = row + dr;
        let c = col + dc;
        let consecutives = 0;

        while (
          r >= 0 && r < board.length &&
          c >= 0 && c < board.length &&
          board[r][c] === stone
        ) {
          consecutives++;
          r += dr;
          c += dc;
        }

        // 检查是否是开放端
        if (
          r >= 0 && r < board.length &&
          c >= 0 && c < board.length &&
          board[r][c] === null
        ) {
          openEnds++;
        }

        count += consecutives;
      }

      // 根据连续数和开放端计算分数
      if (count >= 5) {
        score += 100000; // 五连
      } else if (count === 4) {
        if (openEnds === 2) {
          score += 10000; // 活四
        } else if (openEnds === 1) {
          score += 1000;  // 冲四
        }
      } else if (count === 3) {
        if (openEnds === 2) {
          score += 500;   // 活三
        } else if (openEnds === 1) {
          score += 100;   // 眠三
        }
      } else if (count === 2) {
        if (openEnds === 2) {
          score += 50;    // 活二
        } else if (openEnds === 1) {
          score += 10;    // 眠二
        }
      }
    }

    return score;
  }

  /**
   * 检查指定位置是否能获胜
   */
  private checkWinAt(board: (Stone | null)[][], position: Position, stone: Stone, winCount: number): boolean {
    const { row, col } = position;
    const directions = [
      [[0, 1], [0, -1]],   // 水平
      [[1, 0], [-1, 0]],   // 垂直
      [[1, 1], [-1, -1]],  // 主对角线
      [[1, -1], [-1, 1]]   // 副对角线
    ];

    for (const direction of directions) {
      let count = 1;

      for (const [dr, dc] of direction) {
        let r = row + dr;
        let c = col + dc;

        while (
          r >= 0 && r < board.length &&
          c >= 0 && c < board.length &&
          board[r][c] === stone
        ) {
          count++;
          r += dr;
          c += dc;
        }
      }

      if (count >= winCount) {
        return true;
      }
    }

    return false;
  }

  /**
   * 找到能直接获胜的位置
   */
  private findWinningMoves(board: (Stone | null)[][], emptyPositions: Position[]): Position[] {
    const winningMoves: Position[] = [];
    const config = this.game.getConfig();

    // 创建棋盘副本以安全地模拟落子
    const boardCopy = this.createBoardCopy(board);

    for (const pos of emptyPositions) {
      boardCopy[pos.row][pos.col] = this.aiStone;
      if (this.checkWinAt(boardCopy, pos, this.aiStone, config.winCount)) {
        winningMoves.push(pos);
      }
      boardCopy[pos.row][pos.col] = null;
    }

    return winningMoves;
  }

  /**
   * 找到需要阻止对手的位置
   */
  private findBlockingMoves(board: (Stone | null)[][], emptyPositions: Position[]): Position[] {
    const blockingMoves: Position[] = [];
    const config = this.game.getConfig();
    const opponentStone = this.aiStone === 'black' ? 'white' : 'black';

    // 创建棋盘副本以安全地模拟落子
    const boardCopy = this.createBoardCopy(board);

    for (const pos of emptyPositions) {
      boardCopy[pos.row][pos.col] = opponentStone;
      if (this.checkWinAt(boardCopy, pos, opponentStone, config.winCount)) {
        blockingMoves.push(pos);
      }
      boardCopy[pos.row][pos.col] = null;
    }

    return blockingMoves;
  }

  /**
   * 创建棋盘副本
   */
  private createBoardCopy(board: (Stone | null)[][]): (Stone | null)[][] {
    return board.map(row => [...row]);
  }
}