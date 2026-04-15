import { createServer, IncomingMessage, ServerResponse } from "http";
import { Server } from "socket.io";
import type { ServerToClientEvents, ClientToServerEvents } from "../src/types";

const SOCKET_PORT = parseInt(process.env.PORT || "3001", 10);
const INTERNAL_PORT = parseInt(process.env.INTERNAL_PORT || "3002", 10);
const CORS_ORIGIN = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// --- Socket.IO Server ---

interface ClientInfo {
  userId?: string;
  lat: number;
  lon: number;
}

const clients = new Map<string, ClientInfo>();

const io = new Server<ClientToServerEvents, ServerToClientEvents>({
  cors: {
    origin: CORS_ORIGIN,
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on("join", (data: { userId?: string; lat: number; lon: number }) => {
    clients.set(socket.id, {
      userId: data.userId,
      lat: data.lat,
      lon: data.lon,
    });
    console.log(
      `Client joined: ${socket.id} (user: ${data.userId ?? "anonymous"})`
    );
  });

  socket.on("update-location", (data: { lat: number; lon: number }) => {
    const existing = clients.get(socket.id);
    if (existing) {
      existing.lat = data.lat;
      existing.lon = data.lon;
    } else {
      clients.set(socket.id, { lat: data.lat, lon: data.lon });
    }
  });

  socket.on("disconnect", () => {
    clients.delete(socket.id);
    console.log(`Client disconnected: ${socket.id}`);
  });
});

io.listen(SOCKET_PORT);
console.log(`Socket.IO server listening on port ${SOCKET_PORT}`);

// --- Internal HTTP Server for broadcast ---

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
      io.to(socketId).emit(event as keyof ServerToClientEvents, data as never);
    }
  } else {
    io.emit(event as keyof ServerToClientEvents, data as never);
  }
}

const internalServer = createServer(
  (req: IncomingMessage, res: ServerResponse) => {
    if (req.method === "POST" && req.url === "/broadcast") {
      let body = "";
      req.on("data", (chunk: Buffer) => {
        body += chunk.toString();
      });
      req.on("end", () => {
        try {
          const { event, data, targetUserIds } = JSON.parse(body) as {
            event: string;
            data: unknown;
            targetUserIds?: string[];
          };
          handleBroadcast(event, data, targetUserIds);
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ ok: true }));
        } catch (err) {
          console.error("Invalid broadcast request:", err);
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Invalid request body" }));
        }
      });
    } else {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Not found" }));
    }
  }
);

internalServer.listen(INTERNAL_PORT, () => {
  console.log(`Internal broadcast server listening on port ${INTERNAL_PORT}`);
});
