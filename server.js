// import express from "express";
// import http from "http";
// import { Server } from "socket.io";

// const app = express();
// const server = http.createServer(app);

// const io = new Server(server, {
//   cors: {
//     origin: "*",            
//     methods: ["GET", "POST"]
//   }
// });

// app.use(express.static("docs"));

// io.on("connection", (socket) => {
//   console.log("🟢 New user connected:", socket.id);

//   socket.on("draw", (data) => {
//     socket.broadcast.emit("draw", data);
//   });

//   socket.on("disconnect", () => {
//     console.log("🔴 User disconnected:", socket.id);
//   });
// });

// server.listen(3000, () => console.log("Server running on http://localhost:3000"));

import express from "express";
import http from "http";
import { Server } from "socket.io";

// Use the port Render provides, or default to 3000 for local dev
const PORT = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app);

// Serve your docs folder (index.html, style.css, main.js) if you want Render to serve the frontend too
app.use(express.static("docs"));

// Socket.io server with CORS for your GH Pages frontend
const io = new Server(server, {
  cors: {
    origin: "https://snavc270.github.io", // your GH Pages domain
    methods: ["GET", "POST"]
    // You can also use origin: "*" for testing
  }
});

io.on("connection", (socket) => {
  console.log("User connected: " + socket.id);

  socket.on("draw", (data) => {
    socket.broadcast.emit("draw", data);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected: " + socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


// When I updated my server.js to the new code on notion that runs the server through PORT instead, it just stopped working ? and I couldn't figure out how to get the local server again so I just restarted the project entirely...