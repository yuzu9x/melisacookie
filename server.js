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

const PORT = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app);

app.use(express.static("docs"));

const io = new Server(server, {
  cors: {
    origin: "https://yuzu9x.github.io/melisacookie/", // your GH Pages domain
    methods: ["GET", "POST"]
    
  }
});

let drawings = [];

io.on("connection", (socket) => {
  console.log("User connected: " + socket.id);
  
  // Send current user count to EVERYONEE
  io.emit("user-count", io.engine.clientsCount);
  
  // Send existing drawings to the new user
  socket.emit("load-drawings", drawings);

  socket.on("draw", (data) => {
    // Store the drawing
    drawings.push(data);
    
    // Broadcast to everyone else
    socket.broadcast.emit("draw", data);
  });
  
  socket.on("clear-cookie", (cookieId) => {
    // Remove drawings for this specific cookie
    drawings = drawings.filter(d => d.cookieId !== cookieId);
    socket.broadcast.emit("clear-cookie", cookieId);
  });
  
  socket.on("clear-all", () => {
    // Clear all drawings
    drawings = [];
    socket.broadcast.emit("clear-all");
  });

  socket.on("disconnect", () => {
    console.log("User disconnected: " + socket.id);
    
    // Update user count when someone disconnects
    io.emit("user-count", io.engine.clientsCount);
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// When I updated my server.js to the new code on notion that runs the server through PORT instead, it just stopped working ? and I couldn't figure out how to get the local server again so I just restarted the project entirely...