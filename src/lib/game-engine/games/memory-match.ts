// ===== GAME 4: Memory Match =====
import { GameController, GameRoom } from "../core";

const emojiSets = ["🎮", "🏆", "⚡", "🔥", "💎", "🎯", "🚀", "🌟", "🎪", "🎭", "🎨", "🎵"];

export const memoryMatchController: GameController = {
  gameId: "memory-match",
  gameName: "Memory Match",

  initializeGame(room: GameRoom) {
    const pairCount = 8;
    const emojis = emojiSets.slice(0, pairCount);
    const cards = [...emojis, ...emojis]
      .sort(() => Math.random() - 0.5)
      .map((emoji, i) => ({ id: i, emoji, flipped: false, matched: false }));

    room.players.forEach((p) => {
      p.gameData = { matches: 0, attempts: 0, flippedCards: [] as number[] };
    });

    return { cards, pairCount, totalPairs: pairCount };
  },

  handlePlayerAction(room, playerId, action) {
    const player = room.players.find((p) => p.id === playerId);
    if (!player) return { room };

    const data = player.gameData as { matches: number; attempts: number; flippedCards: number[] };
    const cards = (room.gameData as { cards: Array<{ id: number; emoji: string; matched: boolean }> }).cards;
    const { cardId } = action as { cardId: number };

    const card = cards.find((c) => c.id === cardId);
    if (!card || card.matched) return { room };

    data.flippedCards.push(cardId);

    if (data.flippedCards.length === 2) {
      data.attempts++;
      const [c1, c2] = data.flippedCards.map((id) => cards.find((c) => c.id === id)!);
      if (c1.emoji === c2.emoji) {
        c1.matched = true;
        c2.matched = true;
        data.matches++;
        player.score += 100 + Math.max(0, 50 - data.attempts * 3);
      }
      data.flippedCards = [];
    }

    return {
      room,
      broadcast: { event: "card_flip", playerId, cardId, matches: data.matches },
    };
  },

  calculateScores(room) {
    return room.players
      .sort((a, b) => b.score - a.score || 
        (a.gameData as { attempts: number }).attempts - (b.gameData as { attempts: number }).attempts)
      .map((p, i) => ({ ...p, rank: i + 1 }));
  },

  getBotAction(room, bot, difficulty) {
    const cards = (room.gameData as { cards: Array<{ id: number; emoji: string; matched: boolean }> }).cards;
    const unmatched = cards.filter((c) => !c.matched);
    if (unmatched.length < 2) return null;

    const cfg = {
      easy: { memoryChance: 0.2 },
      medium: { memoryChance: 0.5 },
      hard: { memoryChance: 0.8 },
    }[difficulty];

    // Bot "remembers" cards based on difficulty
    if (Math.random() < cfg.memoryChance) {
      // Find a matching pair
      for (let i = 0; i < unmatched.length; i++) {
        for (let j = i + 1; j < unmatched.length; j++) {
          if (unmatched[i].emoji === unmatched[j].emoji) {
            return { cardId: unmatched[i].id };
          }
        }
      }
    }
    return { cardId: unmatched[Math.floor(Math.random() * unmatched.length)].id };
  },

  validateAction(_room, _playerId, action) {
    const { cardId } = action as { cardId?: number };
    if (cardId === undefined || cardId < 0) {
      return { valid: false, reason: "Invalid card ID" };
    }
    return { valid: true };
  },

  getGameState(room, playerId) {
    const player = room.players.find((p) => p.id === playerId);
    return {
      cards: (room.gameData as { cards: unknown[] }).cards,
      myMatches: (player?.gameData as { matches: number })?.matches || 0,
      scores: room.players.map((p) => ({ id: p.id, username: p.username, score: p.score, isBot: p.isBot })),
    };
  },
};
