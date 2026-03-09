import "dotenv/config";
import { WebSocket, WebSocketServer } from "ws";
import { sub } from "@repo/db/redis";

interface ExtendedWs extends WebSocket {
  contestId?: string;
  isAlive: boolean;
}

const clientMap = new Map<string, Set<ExtendedWs>>();

const wss = new WebSocketServer({ port: 8083 });

console.log("🚀 WebSocket server running on port 8083");

sub.psubscribe("contest:*:updates", (err, count) => {
  if (err) console.error("Redis Subscribe Error:", err);
  else console.log(`📡 Subscribed to ${count} Redis patterns`);
});

sub.on("pmessage", (pattern, channel, message) => {

  const targetContestId = channel.split(":")[1];

  if (!targetContestId) {
    console.log("⚠️ No contestId in channel", channel);
    return;
  }

  const clients = clientMap.get(targetContestId);

  if (!clients || clients.size === 0) {
    console.log(`📭 No clients connected for contest ${targetContestId}`);
    return;
  }

  console.log(
    `📨 Sending update to ${clients.size} clients (contest ${targetContestId})`
  );

  clients.forEach((client) => {

    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }

  });

});

wss.on("connection", (ws: ExtendedWs, req) => {

  const url = new URL(req.url!, "http://localhost");
  const contestId = url.searchParams.get("contestId");

  if (!contestId) {
    ws.close(1008, "Contest ID required");
    return;
  }

  ws.contestId = contestId;
  ws.isAlive = true;

  console.log(`🟢 Client connected to contest ${contestId}`);

  // Add client to map
  if (!clientMap.has(contestId)) {
    clientMap.set(contestId, new Set());
  }

  clientMap.get(contestId)!.add(ws);

  console.log(
    `👥 Total clients for contest ${contestId}: ${clientMap.get(contestId)!.size}`
  );

  ws.on("pong", () => {
    ws.isAlive = true;
  });

  ws.on("close", () => {

    console.log(`🔴 Client disconnected from contest ${contestId}`);

    const clients = clientMap.get(contestId);

    if (clients) {
      clients.delete(ws);

      if (clients.size === 0) {
        clientMap.delete(contestId);
      }
    }

  });

  ws.on("error", (err) => {
    console.error("⚠️ WebSocket error:", err);
  });

});

setInterval(() => {

  wss.clients.forEach((client) => {

    const ws = client as ExtendedWs;

    if (ws.isAlive === false) {
      console.log("💀 Terminating dead connection");
      return ws.terminate();
    }

    ws.isAlive = false;
    ws.ping();

  });

}, 30000);