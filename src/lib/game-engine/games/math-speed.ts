// ===== GAME 5: Math Speed Challenge =====
import { GameController, GameRoom } from "../core";

function generateProblem(difficulty: number): { question: string; answer: number } {
  const ops = ["+", "-", "*"];
  const op = ops[Math.floor(Math.random() * (difficulty > 5 ? 3 : 2))];
  let a: number, b: number, answer: number;

  switch (op) {
    case "+":
      a = Math.floor(Math.random() * (10 * difficulty)) + 1;
      b = Math.floor(Math.random() * (10 * difficulty)) + 1;
      answer = a + b;
      break;
    case "-":
      a = Math.floor(Math.random() * (10 * difficulty)) + 10;
      b = Math.floor(Math.random() * a) + 1;
      answer = a - b;
      break;
    case "*":
      a = Math.floor(Math.random() * (3 * difficulty)) + 2;
      b = Math.floor(Math.random() * 12) + 2;
      answer = a * b;
      break;
    default:
      a = 1; b = 1; answer = 2;
  }

  return { question: `${a} ${op} ${b}`, answer };
}

export const mathSpeedController: GameController = {
  gameId: "math-speed",
  gameName: "Math Speed Challenge",

  initializeGame(room: GameRoom) {
    const totalProblems = 20;
    const problems = Array.from({ length: totalProblems }, (_, i) =>
      generateProblem(Math.floor(i / 4) + 1)
    );
    room.players.forEach((p) => {
      p.gameData = { currentProblem: 0, correct: 0, wrong: 0, streak: 0 };
    });
    return { problems, totalProblems };
  },

  handlePlayerAction(room, playerId, action) {
    const player = room.players.find((p) => p.id === playerId);
    if (!player) return { room };

    const data = player.gameData as { currentProblem: number; correct: number; wrong: number; streak: number };
    const problems = (room.gameData as { problems: Array<{ answer: number }> }).problems;
    const { answer } = action as { answer: number };

    if (data.currentProblem >= problems.length) return { room };

    const correct = problems[data.currentProblem].answer === answer;
    if (correct) {
      data.correct++;
      data.streak++;
      player.score += 100 + data.streak * 20; // Streak bonus
    } else {
      data.wrong++;
      data.streak = 0;
    }
    data.currentProblem++;

    return {
      room,
      broadcast: { event: "problem_solved", playerId, correct, progress: data.currentProblem },
    };
  },

  calculateScores(room) {
    return room.players
      .sort((a, b) => b.score - a.score)
      .map((p, i) => ({ ...p, rank: i + 1 }));
  },

  getBotAction(room, bot, difficulty) {
    const data = bot.gameData as { currentProblem: number };
    const problems = (room.gameData as { problems: Array<{ answer: number }> }).problems;
    if (data.currentProblem >= problems.length) return null;

    const cfg = {
      easy: { accuracy: 0.6 },
      medium: { accuracy: 0.8 },
      hard: { accuracy: 0.95 },
    }[difficulty];

    const correct = problems[data.currentProblem].answer;
    return {
      answer: Math.random() < cfg.accuracy ? correct : correct + Math.floor(Math.random() * 10) - 5,
    };
  },

  validateAction(_room, _playerId, action) {
    const { answer } = action as { answer?: number };
    if (answer === undefined || typeof answer !== "number") {
      return { valid: false, reason: "Answer must be a number" };
    }
    return { valid: true };
  },

  getGameState(room, playerId) {
    const player = room.players.find((p) => p.id === playerId);
    const data = player?.gameData as { currentProblem: number; correct: number; streak: number } | undefined;
    const problems = (room.gameData as { problems: Array<{ question: string }> }).problems;
    return {
      currentProblem: data ? problems[data.currentProblem]?.question : null,
      problemIndex: data?.currentProblem || 0,
      totalProblems: problems.length,
      correct: data?.correct || 0,
      streak: data?.streak || 0,
      scores: room.players.map((p) => ({ id: p.id, username: p.username, score: p.score, isBot: p.isBot })),
    };
  },
};
