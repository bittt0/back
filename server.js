import http from "http";
import { createBareServer } from "@tomphttp/bare-server-node";

// Create the Bare server (Ultraviolet core)
const bare = createBareServer("/bare/");

// Create an HTTP server
const server = http.createServer((req, res) => {
  try {
    // Check if Bare should handle the request
    if (bare.shouldRoute(req)) {
      bare.routeRequest(req, res);
    } else {
      // Only send 404 if headers not already sent
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

// Handle WebSocket / upgrade requests
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

// Start the server
const port = process.env.PORT || 8080;
server.listen(port, () => {
  console.log(`✅ UV backend running on port ${port}`);
});
