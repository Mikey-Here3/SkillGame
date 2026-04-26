// ===== Custom Next.js Server with Socket.io =====
const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(async () => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("Internal server error");
    }
  });

  // Initialize Socket.io
  const { Server: SocketIOServer } = require("socket.io");
  const io = new SocketIOServer(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    transports: ["websocket", "polling"],
  });

  // Simple socket handler (game engine loads via API routes at runtime)
  io.on("connection", (socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);

    socket.on("ping_server", () => {
      socket.emit("pong_server", { timestamp: Date.now() });
    });

    socket.on("disconnect", () => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });
  });

  // Make io accessible globally for the game engine
  globalThis.__socketIO = io;

  server.listen(port, () => {
    console.log(
      `> SkillArena ready on http://${hostname}:${port} (${dev ? "development" : "production"})`
    );
    console.log(`> Socket.io server running`);
  });
});
