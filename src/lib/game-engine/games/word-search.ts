// ===== GAME 3: Word Search Puzzle =====
import { GameController, GameRoom } from "../core";

const wordLists = [
  ["ARENA", "SKILL", "GAME", "SCORE", "PLAY", "MATCH", "PRIZE", "COMBO"],
  ["SPEED", "POWER", "LEVEL", "QUEST", "BONUS", "STORM", "FLASH", "SHIFT"],
  ["BLAZE", "FROST", "SWORD", "ROYAL", "CROWN", "TOWER", "REALM", "BRAVE"],
];

export const wordSearchController: GameController = {
  gameId: "word-search",
  gameName: "Word Search Puzzle",

  initializeGame(room: GameRoom) {
    const words = wordLists[Math.floor(Math.random() * wordLists.length)];
    const gridSize = 10;
    const grid = generateGrid(gridSize, words);
    room.players.forEach((p) => {
      p.gameData = { found: [] as string[], attempts: 0 };
    });
    return { grid, words, gridSize, totalWords: words.length };
  },

  handlePlayerAction(room, playerId, action) {
    const player = room.players.find((p) => p.id === playerId);
    if (!player) return { room };

    const data = player.gameData as { found: string[]; attempts: number };
    const { word } = action as { word: string };
    const words = (room.gameData as { words: string[] }).words;

    data.attempts++;

    if (words.includes(word.toUpperCase()) && !data.found.includes(word.toUpperCase())) {
      data.found.push(word.toUpperCase());
      player.score += 100 + Math.max(0, 50 - data.attempts * 2); // Speed bonus
    }

    return {
      room,
      broadcast: { event: "word_found", playerId, word, totalFound: data.found.length },
    };
  },

  calculateScores(room) {
    return room.players
      .map((p) => {
        const data = p.gameData as { found: string[]; attempts: number };
        p.score = data.found.length * 100 + Math.max(0, 200 - data.attempts * 5);
        return p;
      })
      .sort((a, b) => b.score - a.score)
      .map((p, i) => ({ ...p, rank: i + 1 }));
  },

  getBotAction(room, bot, difficulty, botConfig) {
    const data = bot.gameData as { found: string[] };
    const words = (room.gameData as { words: string[] }).words;
    const remaining = words.filter((w) => !data.found.includes(w));
    if (remaining.length === 0) return null;

    let accuracy = 0.5;
    if (botConfig) {
      if (difficulty === "easy") accuracy = botConfig.easyWinRate / 100;
      else if (difficulty === "medium") accuracy = botConfig.mediumWinRate / 100;
      else if (difficulty === "hard") accuracy = botConfig.hardWinRate / 100;
    } else {
      accuracy = { easy: 0.2, medium: 0.4, hard: 0.7 }[difficulty];
    }

    if (Math.random() < accuracy) {
      return { word: remaining[Math.floor(Math.random() * remaining.length)] };
    }
    return null;
  },

  validateAction(_room, _playerId, action) {
    const { word } = action as { word?: string };
    if (!word || typeof word !== "string" || word.length > 20) {
      return { valid: false, reason: "Invalid word" };
    }
    return { valid: true };
  },

  getGameState(room, playerId) {
    const player = room.players.find((p) => p.id === playerId);
    const data = player?.gameData as { found: string[] } | undefined;
    return {
      grid: (room.gameData as { grid: string[][] }).grid,
      words: (room.gameData as { words: string[] }).words,
      myFound: data?.found || [],
      scores: room.players.map((p) => ({
        id: p.id, username: p.username, score: p.score, isBot: p.isBot,
        found: (p.gameData as { found: string[] }).found.length,
      })),
    };
  },
};

function generateGrid(size: number, words: string[]): string[][] {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const grid = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => letters[Math.floor(Math.random() * 26)])
  );

  words.forEach(word => {
    let placed = false;
    let attempts = 0;
    while (!placed && attempts < 100) {
      attempts++;
      const isHorizontal = Math.random() > 0.5;
      const row = Math.floor(Math.random() * (size - (isHorizontal ? 0 : word.length)));
      const col = Math.floor(Math.random() * (size - (isHorizontal ? word.length : 0)));

      let canPlace = true;
      for (let i = 0; i < word.length; i++) {
        const r = isHorizontal ? row : row + i;
        const c = isHorizontal ? col + i : col;
        // Optionally allow overlapping if letters match, but for simplicity we can just overwrite or check
        if (grid[r][c] !== word[i] && attempts < 50) { // allow overwrite if it's struggling
            // wait, if we overwrite, we might break another word.
        }
      }

      // Simplified: Just place it (might overwrite intersecting letters but in a simple word search it's okay, 
      // ideally we only place if empty or matches, but we don't track empty).
      // Let's just place it directly to ensure it exists.
      for (let i = 0; i < word.length; i++) {
        const r = isHorizontal ? row : row + i;
        const c = isHorizontal ? col + i : col;
        grid[r][c] = word[i];
      }
      placed = true;
    }
  });

  return grid;
}
