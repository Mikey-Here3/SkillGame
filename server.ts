// ===== Custom Next.js Server with Socket.io =====
import "dotenv/config";
import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server as SocketIOServer } from "socket.io";
import { registerAllGames } from "./src/lib/game-engine/index";
import { initializeSocketServer } from "./src/lib/game-engine/socket-server";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(async () => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("Internal server error");
    }
  });

  // Initialize Socket.io
  const io = new SocketIOServer(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    transports: ["websocket", "polling"],
  });

  // Register all game controllers
  registerAllGames();
  console.log("[Server] All game controllers registered");

  // Initialize socket event handlers
  initializeSocketServer(io);
  console.log("[Server] Socket.io handlers initialized");

  server.listen(port, () => {
    console.log(
      `> SkillArena ready on http://${hostname}:${port} (${dev ? "development" : "production"})`
    );
    console.log(`> Socket.io server running`);
  });
});
