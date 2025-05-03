const socket = io();
let localStream;
let remoteStream;
let peerConnection;
let roomId = "";

const servers = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");
const messageInput = document.getElementById("messageInput");
const messagesDiv = document.getElementById("messages");
const sendBtn = document.getElementById("sendBtn");

// Join room
function joinRoom() {
  const input = document.getElementById("roomInput");
  roomId = input.value.trim();

  if (!roomId) {
    alert("Please enter a room ID");
    return;
  }

  document.getElementById("joinRoom").style.display = "none";
  document.getElementById("videoCall").style.display = "block";

  socket.emit("join", roomId);
}

// Get local media (Doctor's video)
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  .then(stream => {
    localStream = stream;
    localVideo.srcObject = stream;
  })
  .catch(error => {
    console.log("Error getting local media", error);
  });

// 2. User joined
socket.on("user-joined", async () => {
  startPeerConnection();

  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  socket.emit("offer", offer, roomId);
});

// 3. Received offer
socket.on("offer", async offer => {
  startPeerConnection();

  await peerConnection.setRemoteDescription(offer);
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  socket.emit("answer", answer, roomId);
});

// 4. Received answer
socket.on("answer", async answer => {
  await peerConnection.setRemoteDescription(answer);
});

// 5. ICE candidates
socket.on("ice-candidate", candidate => {
  if (peerConnection) {
    peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  }
});

// 6. Create peer connection and set handlers
function startPeerConnection() {
  peerConnection = new RTCPeerConnection(servers);

  // Add local stream tracks to the peer connection (Doctor's video)
  localStream.getTracks().forEach(track => {
    peerConnection.addTrack(track, localStream);
  });

  remoteStream = new MediaStream();
  remoteVideo.srcObject = remoteStream;

  peerConnection.ontrack = event => {
    event.streams[0].getTracks().forEach(track => {
      remoteStream.addTrack(track); // Add the patient’s track
    });
  };

  peerConnection.onicecandidate = event => {
    if (event.candidate) {
      socket.emit("ice-candidate", event.candidate, roomId);
    }
  };
}

// 7. Chat logic
sendBtn.addEventListener("click", sendMessage);
messageInput.addEventListener("keypress", e => {
  if (e.key === "Enter") sendMessage();
});

function sendMessage() {
  const message = messageInput.value.trim();
  if (message) {
    socket.emit("chat-message", { roomId, message });
    appendMessage("You", message);
    messageInput.value = "";
  }
}

function appendMessage(sender, message) {
  const msgDiv = document.createElement("div");
  msgDiv.textContent = `${sender}: ${message}`;
  messagesDiv.appendChild(msgDiv);
}

// 8. Receive chat message
socket.on("chat-message", ({ sender = "Friend", message }) => {
  appendMessage(sender, message);
});
