const express = require("express");
const app = express();
const server = require("http").Server(app);
const { v4: uuidv4 } = require("uuid");
app.set("view engine", "ejs");
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});
const { ExpressPeerServer } = require("peer");
const opinions = {
  debug: true,
};

app.use("/peerjs", ExpressPeerServer(server, opinions));
app.use(express.static("public"));

// app.get("/", (req, res) => {
//   res.redirect(`/${uuidv4()}`);
// });

// app.get("/:room", (req, res) => {
//   res.render("room", { roomId: req.params.room });
// });

app.get("/create-meeting", (req, res) => {
  res.render("create-meeting", { roomId: uuidv4() });
});

app.get("/join-meeting", (req, res) => {
  res.render("join-meeting");
});

// io.on("connection", (socket) => {
//   socket.on("join-room", (roomId, userId, userName) => {
//     socket.join(roomId);
//     setTimeout(() => {
//       socket.to(roomId).emit("user-connected", userId);
//     }, 1000);
//     socket.on("message", (message) => {
//       io.to(roomId).emit("createMessage", message, userName);
//     });
//     socket.on("leave-room", (roomId) => {
//       socket.leave(roomId);
//       // socket.to(roomId).emit("user-disconnected", userId);
//     });
//     socket.on("disconnect", () => {
//       socket.leave(roomId);
//       socket.to(roomId).emit("user-disconnected", userId);
//     });
//   });
// });

const meetingIo = io.of("/meeting");

meetingIo.on("connection", (socket) => {
  // console.log('User connected');
  // let rooms = io.sockets.adapter.rooms;
  // console.log(rooms)
  // socket.on("create-meeting",(roomId)=>{
  //   socket.join(roomId);
  // });
  // socket.on("disconnect",()=>{
  //   console.log('user disconected')
  // });
  socket.on("join-room", (roomId, userId, userName) => {
    console.log("join a room", roomId);
    socket.join(roomId);
    socket.to(roomId).emit("user-connected", userId);
    socket.on("message", (message) => {
      console.log("message", message);
      console.log('Username', userName)
      meetingIo.to(roomId).emit("createMessage", message, userName);
    });

    socket.on("leave-room", (roomID) => {
      console.log("leave room", roomID);
      socket.leave(roomID);
      meetingIo.to(roomID).emit("user-disconnected", userId);
    });
    socket.on("disconnect", () => {
      console.log("User disconnected");
      socket.leave(roomId);
      meetingIo.to(roomId).emit("user-disconnected", userId);
    });
  });
});

server.listen(3030);
