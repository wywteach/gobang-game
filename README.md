# 五子棋游戏 (Gobang Game)

一个使用 TypeScript 开发的网页版五子棋游戏。

## 功能特性

- 🎮 双人对战模式
- 🏆 自动判断胜负
- 🎨 精美的游戏界面
- ✨ 获胜棋子高亮显示
- 🔄 一键重新开始
- 📱 响应式设计，支持移动端

## 技术栈

- TypeScript 5.2+
- HTML5
- CSS3
- ES6 模块

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式（监听文件变化自动编译）

```bash
npm run dev
```

### 构建项目

```bash
npm run build
```

### 运行类型检查

```bash
npm run typecheck
```

### 启动本地服务器

```bash
npm run serve
```

然后在浏览器中打开 `http://localhost:8080`

## 游戏规则

1. 黑棋先手，白棋后手
2. 玩家轮流在棋盘的交叉点上放置棋子
3. 先将五个棋子连成一线（横、竖、斜）的玩家获胜
4. 棋盘填满后仍无人获胜则为平局

## 项目结构

```
src/
├── types/           # 类型定义
│   └── game.ts     # 游戏相关类型
├── core/           # 核心逻辑
│   └── Game.ts     # 游戏核心类
├── utils/          # 工具函数（预留）
├── main.ts         # 主程序入口
├── index.html      # HTML页面
└── styles.css      # 样式文件
```

## 开发说明

- 代码使用 ES 模块(import/export)语法
- 使用解构导入方式
- 所有代码包含中文注释
- 完成代码更改后务必运行类型检查

## 许可证

MIT License