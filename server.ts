import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const port = parseInt(process.env.PORT || "3000", 10);

// Debug: log DATABASE_URL prefix on startup
const dbUrl = process.env.DATABASE_URL || "(not set)";
console.log(`DATABASE_URL starts with: ${dbUrl.substring(0, 15)}... (length: ${dbUrl.length})`);

const app = next({ dev });
const handle = app.getRequestHandler();

interface ClientInfo {
  userId?: string;
  user?: {
    id: string;
    username: string;
    displayName: string | null;
    profileImg: string | null;
  } | null;
  anonId?: string | null;
  anonAvatar?: string | null;
  lat: number;
  lon: number;
}

const clients = new Map<string, ClientInfo>();

// Presence entry as sent to clients — deduplicated by user.
interface PresenceEntry {
  kind: "user" | "anon";
  id: string; // userId or anonId
  name: string;
  profileImg?: string | null;
  anonAvatar?: string | null;
  username?: string;
}

function buildPresenceList(): PresenceEntry[] {
  const users = new Map<string, PresenceEntry>();
  const anons = new Map<string, PresenceEntry>();

  for (const info of clients.values()) {
    if (info.user) {
      if (!users.has(info.user.id)) {
        users.set(info.user.id, {
          kind: "user",
          id: info.user.id,
          name: info.user.displayName || info.user.username,
          username: info.user.username,
          profileImg: info.user.profileImg ?? null,
        });
      }
    } else if (info.anonId) {
      const existing = anons.get(info.anonId);
      if (!existing) {
        anons.set(info.anonId, {
          kind: "anon",
          id: info.anonId,
          name: info.anonId, // client derives display name from anonId
          anonAvatar: info.anonAvatar ?? null,
        });
      } else if (info.anonAvatar && !existing.anonAvatar) {
        existing.anonAvatar = info.anonAvatar;
      }
    }
  }

  return [...users.values(), ...anons.values()];
}

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

  const broadcastPresence = () => {
    io.emit("presence", buildPresenceList());
  };

  io.on("connection", (socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on(
      "join",
      (data: {
        userId?: string;
        user?: ClientInfo["user"];
        anonId?: string | null;
        anonAvatar?: string | null;
        lat: number;
        lon: number;
      }) => {
        clients.set(socket.id, {
          userId: data.userId,
          user: data.user ?? null,
          anonId: data.anonId ?? null,
          anonAvatar: data.anonAvatar ?? null,
          lat: data.lat,
          lon: data.lon,
        });
        // Send current presence to the new client immediately,
        // then broadcast to everyone else so they see the new arrival.
        socket.emit("presence", buildPresenceList());
        broadcastPresence();
      }
    );

    socket.on("update-location", (data: { lat: number; lon: number }) => {
      const existing = clients.get(socket.id);
      if (existing) {
        existing.lat = data.lat;
        existing.lon = data.lon;
      }
    });

    socket.on(
      "update-identity",
      (data: { anonAvatar?: string | null; user?: ClientInfo["user"] }) => {
        const existing = clients.get(socket.id);
        if (!existing) return;
        if ("anonAvatar" in data) existing.anonAvatar = data.anonAvatar ?? null;
        if ("user" in data) existing.user = data.user ?? null;
        broadcastPresence();
      }
    );

    socket.on("disconnect", () => {
      clients.delete(socket.id);
      broadcastPresence();
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
