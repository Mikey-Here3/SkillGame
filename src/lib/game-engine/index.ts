// ===== GAME REGISTRY =====
// Import and register all game controllers here

import { registerGameController } from "./core";
import { reactionSpeedController } from "./games/reaction-speed";
import { fruitSliceController } from "./games/fruit-slice";
import { wordSearchController } from "./games/word-search";
import { memoryMatchController } from "./games/memory-match";
import { mathSpeedController } from "./games/math-speed";
import { typingSpeedController } from "./games/typing-speed";
import { targetHitController } from "./games/target-hit";
import { sequenceMemoryController } from "./games/sequence-memory";
import { ticTacToeController } from "./games/tic-tac-toe";
import { chessBlitzController } from "./games/chess-blitz";
import { crashTimingController } from "./games/crash-timing";

export function registerAllGames() {
  registerGameController(reactionSpeedController);
  registerGameController(fruitSliceController);
  registerGameController(wordSearchController);
  registerGameController(memoryMatchController);
  registerGameController(mathSpeedController);
  registerGameController(typingSpeedController);
  registerGameController(targetHitController);
  registerGameController(sequenceMemoryController);
  registerGameController(ticTacToeController);
  registerGameController(chessBlitzController);
  registerGameController(crashTimingController);
}

// All supported games metadata for frontend
export const GAME_LIST = [
  { id: "reaction-speed", name: "Reaction Speed Battle", icon: "⚡", description: "Test your reflexes! React faster than your opponents.", color: "from-yellow-500 to-orange-500", category: "speed" },
  { id: "fruit-slice", name: "Fruit Slice", icon: "🍉", description: "Slice fruits, dodge bombs, build combos!", color: "from-green-500 to-emerald-500", category: "action" },
  { id: "word-search", name: "Word Search Puzzle", icon: "🔤", description: "Find hidden words faster than anyone else.", color: "from-blue-500 to-cyan-500", category: "puzzle" },
  { id: "memory-match", name: "Memory Match", icon: "🧠", description: "Match pairs of cards from memory.", color: "from-purple-500 to-pink-500", category: "puzzle" },
  { id: "math-speed", name: "Math Speed Challenge", icon: "🔢", description: "Solve math problems at lightning speed!", color: "from-indigo-500 to-blue-500", category: "speed" },
  { id: "typing-speed", name: "Typing Speed Battle", icon: "⌨️", description: "Type faster and more accurately to win!", color: "from-cyan-500 to-teal-500", category: "speed" },
  { id: "target-hit", name: "Target Hit", icon: "🎯", description: "Click targets with precision and speed!", color: "from-red-500 to-rose-500", category: "action" },
  { id: "sequence-memory", name: "Sequence Memory", icon: "🔗", description: "Remember and repeat longer sequences.", color: "from-violet-500 to-purple-500", category: "puzzle" },
  { id: "tic-tac-toe", name: "Tic Tac Toe", icon: "❌", description: "Classic strategy game — outsmart your opponent!", color: "from-amber-500 to-yellow-500", category: "strategy" },
  { id: "chess-blitz", name: "Chess Blitz", icon: "♟️", description: "3-minute chess. Think fast, play faster!", color: "from-slate-500 to-gray-600", category: "strategy", gameDuration: 360 },
  { id: "crash-timing", name: "Crash Timing", icon: "📈", description: "Cash out at the right time — skill-based timing!", color: "from-emerald-500 to-lime-500", category: "timing" },
];

export * from "./core";
