const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static("public")); // Serve static files

io.on("connection", socket => {
  console.log("A user connected");

  // Join a room
  socket.on("join", roomId => {
    console.log(`User joined room: ${roomId}`);
    socket.join(roomId);
    socket.to(roomId).emit("user-joined");
  });

  // Handle incoming offer (doctor sends offer to the patient)
  socket.on("offer", (offer, roomId) => {
    console.log(`Offer received in room: ${roomId}`);
    socket.to(roomId).emit("offer", offer);
  });

  // Handle incoming answer (patient sends answer to the doctor)
  socket.on("answer", (answer, roomId) => {
    console.log(`Answer received in room: ${roomId}`);
    socket.to(roomId).emit("answer", answer);
  });

  // Handle incoming ICE candidate (for NAT traversal)
  socket.on("ice-candidate", (candidate, roomId) => {
    console.log(`ICE candidate received in room: ${roomId}`);
    socket.to(roomId).emit("ice-candidate", candidate);
  });

  // Handle incoming chat messages
  socket.on("chat-message", ({ roomId, message }) => {
    console.log(`Chat message received in room: ${roomId}`);
    socket.to(roomId).emit("chat-message", { sender: "Guest", message });
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

// Start server
http.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
