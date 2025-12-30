
export enum GameScene {
  START_MENU = 'START_MENU',
  HOW_TO_PLAY = 'HOW_TO_PLAY',
  GAMEPLAY = 'GAMEPLAY',
  GAME_OVER = 'GAME_OVER',
  LEADERBOARD = 'LEADERBOARD'
}

export enum InputMode {
  CURSOR = 'CURSOR',
  VISION = 'VISION'
}

export enum GameDifficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD'
}

export enum GameTheme {
  COSMIC = 'COSMIC',
  NEON_CITY = 'NEON_CITY',
  NATURE = 'NATURE',
  URBAN_RAIN = 'URBAN_RAIN',
  MIND_LAB = 'MIND_LAB',
  RETRO = 'RETRO'
}

export enum ObjectType {
  GOOD = 'GOOD',
  BAD = 'BAD'
}

export interface GameObject {
  id: string;
  x: number;
  y: number;
  radius: number;
  speed: number;
  type: ObjectType;
  variant: string;
  horizontalVel?: number;
  phase?: number;
}

export interface PlayerAvatar {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

export interface LeaderboardEntry {
  id: string;
  pilotName: string;
  avatarId: string;
  score: number;
  theme: GameTheme;
  difficulty: GameDifficulty;
  date: number;
}

export interface GameState {
  score: number;
  highScore: number;
  lives: number;
  maxLives: number;
  isPaused: boolean;
  combo: number;
  difficulty: number;
  gameDifficulty: GameDifficulty;
  objects: GameObject[];
  handX: number;
  isHandDetected: boolean;
  inputMode: InputMode;
  theme: GameTheme;
  avatar: PlayerAvatar;
  levelStartTime: number;
  currentTime: number;
}

export interface TrackingConfig {
  sensitivity: number;
  threshold: number;
}
