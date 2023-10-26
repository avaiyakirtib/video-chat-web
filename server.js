const express = require("express");
const app = express();
const server = require("http").Server(app);
const { v4: uuidv4 } = require("uuid");
const path = require("path");
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
// app.use(express.static("public"));
app.use("/join-meeting", express.static(path.join(__dirname, "public")));

// app.get("/", (req, res) => {
//   res.redirect(`/${uuidv4()}`);
// });

// app.get("/:room", (req, res) => {
//   res.render("room", { roomId: req.params.room });
// });

// app.get("/create-meeting/:id", (req, res) => {
//   res.render("create-meeting", { roomId: req.params.id });
// });

app.get("/join-meeting", (req, res) => {
  res.render("join-meeting");
  // io.on("connection",(socket)=>{
  //   console.log('User Connected')
  // });
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

let availableUser = [];

app.get("/", (req, res) => {
  return res.send(availableUser);
});

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
  // socket.on("join-room", (roomId, userId, userName) => {
  //   console.log(roomId, ">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
  //   console.log(userId + " join a room " + roomId);
  //   socket.join(roomId);
  //   setTimeout(() => {
  //     socket.to(roomId).emit("user-connected", userId);
  //   }, 1000);
  //   socket.on("message", (message) => {
  //     console.log("message is ", message);
  //     meetingIo.to(roomId).emit("createMessage", message, userName);
  //   });
  //   socket.on("leave-room", (roomID) => {
  //     console.log("leave room ", roomID);
  //     socket.leave(roomID);
  //     meetingIo.to(roomID).emit("user-disconnected", userId);
  //   });
  //   socket.on("disconnect", () => {
  //     console.log("User disconnected ", userId);
  //     socket.leave(roomId);
  //     meetingIo.to(roomId).emit("user-disconnected", userId);
  //   });
  // });

  //................................................................................................................

  socket.on("user-connect", (userId) => {
    // console.log(socket.id)d], "sdfsdfdsfddsdfsdfsddd");
    // const targetSocket = io.sockets.sockets[socket.id];
    // io.sockets.sockets[targetSocket].join('roomName');
    // console.log(io.sockets[socket.io])
    console.log("New user connected ", userId);
    availableUser.push({
      socket: socket.id,
      userId,
      isOn: false,
    });
    console.log("Online user", availableUser.length);
    meetingIo.emit("online-user", availableUser.length);
  });

  socket.on("random", () => {
    console.log("random User");
    let filterOnlineUser = availableUser.filter((e) => !e.isOn);
    let randomUser = Math.floor(Math.random() * filterOnlineUser.length);
    let otherUser = filterOnlineUser[randomUser];
    if (otherUser?.socket == socket.id) {
      randomUser = Math.floor(Math.random() * filterOnlineUser.length);
      otherUser = filterOnlineUser[randomUser];
    }
    if (otherUser) {
      // let mySocketIndex = availableUser.findIndex(
      //   (e) => e.socket === socket.id
      // );
      // let randomSocketIndex = availableUser.findIndex(e=>e.socket === otherUser.socket);
      if (otherUser.socket === socket.id) {
        console.log("Please try later.. no user found on online");
        return socket.emit(
          "message",
          "Please try later.. no user found on online"
        );
      }
      availableUser.map((e) => {
        if (e.socket === socket.id) {
          e.isOn = true;
        } else if (e.socket === otherUser.socket) {
          e.isOn = true;
        }
      });
      // availableUser.splice(randomUser, 1);
      // availableUser.splice(mySocketIndex, 1);
      console.log("random user selected", otherUser?.userId);
      socket.emit("random-user", otherUser?.userId);
    } else {
      console.log("Please try later.. no user found on online");
      return socket.emit(
        "message",
        "Please try later.. no user found on online"
      );
    }
  });
  socket.on("random-leave", (userId) => {
    console.log("user leave ", userId);
    availableUser.map((e) => {
      if (e.socket === socket.id) {
        e.isOn = false;
      } else if (e.userId === userId) {
        e.isOn = false;
      }
    });
  });

  socket.on("disconnect", () => {
    let mySocketIndex = availableUser.findIndex((e) => e.socket === socket.id);
    console.log("User disconnected", mySocketIndex.userId);
    availableUser.splice(mySocketIndex, 1);
    console.log("Online user dfdfd", availableUser.length);
    meetingIo.emit("online-user", availableUser.length);
  });
});

server.listen(process.env.PORT || 3030);
