const socket = io("/meeting");
const videoGrid = document.getElementById("video-grid");
const myVideo = document.createElement("video");
const showChat = document.querySelector("#showChat");
const backBtn = document.querySelector(".header__back");
myVideo.muted = true;

backBtn.addEventListener("click", () => {
  document.querySelector(".main__left").style.display = "flex";
  document.querySelector(".main__left").style.flex = "1";
  document.querySelector(".main__right").style.display = "none";
  document.querySelector(".header__back").style.display = "none";
});

showChat.addEventListener("click", () => {
  document.querySelector(".main__right").style.display = "flex";
  document.querySelector(".main__right").style.flex = "1";
  document.querySelector(".main__left").style.display = "none";
  document.querySelector(".header__back").style.display = "block";
});

const ROOM_ID = prompt('Enter your code');
const user = prompt("Enter your name");

var peer = new Peer({
  // in localhost
  // host: "127.0.0.1",
  // port: 3030,
  // path: "/peerjs",

  //in live
  host: "https://video-chat-web.onrender.com",
  secure: true, // Use true for HTTPS
  port: 443,
  path: "/peerjs",

  debug: 3,
});

let myVideoStream;
const peers = {};
navigator.mediaDevices
  .getUserMedia({
    audio: true,
    video: true,
  })
  .then((stream) => {
    myVideoStream = stream;
    addVideoStream(myVideo, stream);

    peer.on("call", (call) => {
      console.log("someone call me");
      call.answer(stream);
      // let userId = localStorage.getItem('userId');
      const video = document.createElement("video");
      // video.id = userId;
      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream);
      });
    });

    socket.on("user-connected", (userId) => {
      connectToNewUser(userId, stream);
    });
  });

const connectToNewUser = (userId, stream) => {
  console.log("I call someone" + userId);
  const call = peer.call(userId, stream);
  const video = document.createElement("video");
  // localStorage.setItem("userId", userId);
  // video.id = userId
  call.on("stream", (userVideoStream) => {
    addVideoStream(video, userVideoStream);
  });
  call.on("close", () => {
    video.remove();
  });
  peers[userId] = call;
};

socket.on("user-disconnected", (userId) => {
  console.log("cut the call", userId);
//   if (peers[userId]) peers[userId].close();

  // const parentElement = myVideo.parentElement; // Get the parent element (e.g., a div, body, or any other containing element)
  // if (parentElement) {
  //   parentElement.removeChild(myVideo); // Remove the video element from its parent
  // } else {
  //   console.log("Element has no parent.");
  // }
});

peer.on("open", (id) => {
  // localStorage.setItem("userId", id);
  console.log('my id is ',id)
  socket.emit("user-connect", id);
});

const addVideoStream = (video, stream) => {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
    videoGrid.append(video);
  });
};

let text = document.querySelector("#chat_message");
let send = document.getElementById("send");
let messages = document.querySelector(".messages");

send.addEventListener("click", (e) => {
  if (text.value.length !== 0) {
    socket.emit("message", text.value);
    text.value = "";
  }
});

text.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && text.value.length !== 0) {
    socket.emit("message", text.value);
    text.value = "";
  }
});

const inviteButton = document.querySelector("#inviteButton");
const muteButton = document.querySelector("#muteButton");
const stopVideo = document.querySelector("#stopVideo");
const allVideo = document.getElementsByTagName("video");
muteButton.addEventListener("click", () => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    html = `<i class="fas fa-microphone-slash"></i>`;
    muteButton.classList.toggle("background__red");
    muteButton.innerHTML = html;
  } else {
    myVideoStream.getAudioTracks()[0].enabled = true;
    html = `<i class="fas fa-microphone"></i>`;
    muteButton.classList.toggle("background__red");
    muteButton.innerHTML = html;
  }
});

function getEndCall() {
    const parentElement = myVideo.parentElement;
    const childElements = parentElement.children;
    // console.log(parentElement);
    // console.log(allVideo);
    // console.log(peer.id);
    socket.emit("leave-room",ROOM_ID);  
    // peer.close();
    peer.destroy();
  for (let i = childElements.length - 1; i > 0; i--) {
    parentElement.removeChild(childElements[i]);
  }
}

stopVideo.addEventListener("click", () => {
  const enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    html = `<i class="fas fa-video-slash"></i>`;
    stopVideo.classList.toggle("background__red");
    stopVideo.innerHTML = html;
  } else {
    myVideoStream.getVideoTracks()[0].enabled = true;
    html = `<i class="fas fa-video"></i>`;
    stopVideo.classList.toggle("background__red");
    stopVideo.innerHTML = html;
  }
});

socket.on("createMessage", (message, userName) => {
    console.log('this is client')
  messages.innerHTML =
    messages.innerHTML +
    `<div class="message">
        <b><i class="far fa-user-circle"></i> <span> ${
          userName === user ? "me" : userName
        }</span> </b>
        <span>${message}</span>
    </div>`;
});
