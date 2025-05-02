const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static("public"));

io.on("connection", socket => {
  socket.on("join", room => {
    socket.join(room);
    socket.to(room).emit("user-joined", socket.id);
    
    socket.on("offer", data => {
      socket.to(room).emit("offer", data);
    });

    socket.on("answer", data => {
      socket.to(room).emit("answer", data);
    });

    socket.on("ice-candidate", data => {
      socket.to(room).emit("ice-candidate", data);
    });
  });
});

http.listen(3000, () => console.log("Server running on http://localhost:3000"));
