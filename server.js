import express from "express";
import { createBareServer } from "@tomphttp/bare-server-node";
import http from "http";

const app = express();
const server = http.createServer(app);

// Create a Bare server (the UV backend core)
const bare = createBareServer("/bare/");

// Hook the Bare server into requests
server.on("request", (req, res) => {
  if (bare.shouldRoute(req)) {
    bare.routeRequest(req, res);
  } else {
    res.writeHead(404);
    res.end("Not Found");
  }
});

// Hook into upgrades (WebSockets, etc.)
server.on("upgrade", (req, socket, head) => {
  if (bare.shouldRoute(req)) {
    bare.routeUpgrade(req, socket, head);
  } else {
    socket.end();
  }
});

const port = process.env.PORT || 8080;
server.listen(port, () => {
  console.log(`✅ UV backend running on port ${port}`);
});
