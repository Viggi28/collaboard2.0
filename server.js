const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const socketIo = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

const drawings = [];
let users = {};

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = socketIo(server);

  io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);

    socket.on("setUsername", ({ username, roomId }) => {
      users[socket.id] = { username, roomId, color: "#000000", size: 5 };
      socket.join(roomId);
      io.to(roomId).emit("updateUsers", Object.values(users).filter(user => user.roomId === roomId));

      // Send all previous drawings to the new client
      socket.emit("init", drawings.filter(d => d.roomId === roomId));
    });

    socket.on("draw", (data) => {
      drawings.push(data);
      io.to(data.roomId).emit("draw", data);
    });

    socket.on("updatePen", (data) => {
      if (users[socket.id]) {
        users[socket.id].color = data.color;
        users[socket.id].size = data.size;
        io.to(data.roomId).emit("updateUsers", Object.values(users).filter(user => user.roomId === data.roomId));
      }
    });

    socket.on("clearCanvas", (roomId) => {
      drawings = drawings.filter(d => d.roomId !== roomId);
      io.to(roomId).emit("clearCanvas");
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
      const user = users[socket.id];
      if (user) {
        delete users[socket.id];
        io.to(user.roomId).emit("updateUsers", Object.values(users).filter(u => u.roomId === user.roomId));
      }
    });
  });

  const port = process.env.PORT || 3000;
  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
  });
});
