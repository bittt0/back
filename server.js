import http from "http";
import { createBareServer } from "@tomphttp/bare-server-node";

const bare = createBareServer("/bare/"); // must match frontend prefix

const server = http.createServer((req, res) => {
  try {
    // CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "*");

    // Handle preflight OPTIONS requests
    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    // Simple homepage
    if (req.url === "/" || req.url === "/index.html") {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end("<h1>✅ UV Backend Running!</h1>");
      return;
    }

    // Route Bare server requests
    if (bare.shouldRoute(req)) {
      bare.routeRequest(req, res);
    } else {
      if (!res.headersSent) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not Found");
      }
    }
  } catch (err) {
    console.error("Request error:", err);
    if (!res.headersSent) {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("Internal Server Error");
    }
  }
});

// WebSocket / upgrades
server.on("upgrade", (req, socket, head) => {
  try {
    if (bare.shouldRoute(req)) {
      bare.routeUpgrade(req, socket, head);
    } else {
      socket.end();
    }
  } catch (err) {
    console.error("Upgrade error:", err);
    socket.end();
  }
});

const port = process.env.PORT || 8080;
server.listen(port, () => {
  console.log(`✅ UV backend running on port ${port}`);
});
