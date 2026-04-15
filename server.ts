import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev });
const handle = app.getRequestHandler();

interface ClientInfo {
  userId?: string;
  lat: number;
  lon: number;
}

const clients = new Map<string, ClientInfo>();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    // Internal broadcast endpoint (same server, path-based)
    if (req.method === "POST" && req.url === "/_internal/broadcast") {
      let body = "";
      req.on("data", (chunk: Buffer) => {
        body += chunk.toString();
      });
      req.on("end", () => {
        try {
          const { event, data, targetUserIds } = JSON.parse(body);
          handleBroadcast(event, data, targetUserIds);
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ ok: true }));
        } catch {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Invalid request body" }));
        }
      });
      return;
    }

    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  // Attach Socket.IO to the same HTTP server
  const io = new Server(httpServer, {
    cors: {
      origin: dev
        ? "http://localhost:3000"
        : process.env.NEXT_PUBLIC_APP_URL || "*",
      methods: ["GET", "POST"],
    },
    path: "/socket.io",
  });

  io.on("connection", (socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on("join", (data: { userId?: string; lat: number; lon: number }) => {
      clients.set(socket.id, {
        userId: data.userId,
        lat: data.lat,
        lon: data.lon,
      });
    });

    socket.on("update-location", (data: { lat: number; lon: number }) => {
      const existing = clients.get(socket.id);
      if (existing) {
        existing.lat = data.lat;
        existing.lon = data.lon;
      }
    });

    socket.on("disconnect", () => {
      clients.delete(socket.id);
    });
  });

  function getSocketIdsByUserIds(userIds: string[]): string[] {
    const userIdSet = new Set(userIds);
    const socketIds: string[] = [];
    for (const [socketId, info] of clients.entries()) {
      if (info.userId && userIdSet.has(info.userId)) {
        socketIds.push(socketId);
      }
    }
    return socketIds;
  }

  function handleBroadcast(
    event: string,
    data: unknown,
    targetUserIds?: string[]
  ) {
    if (targetUserIds && targetUserIds.length > 0) {
      const socketIds = getSocketIdsByUserIds(targetUserIds);
      for (const socketId of socketIds) {
        io.to(socketId).emit(event, data as never);
      }
    } else {
      io.emit(event, data as never);
    }
  }

  httpServer.listen(port, () => {
    console.log(`> Chatterfall running on http://localhost:${port}`);
    console.log(`> Socket.IO attached on same port`);
  });
});
