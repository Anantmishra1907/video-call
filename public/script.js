let socket = io();
let localStream, remoteStream, peer;
let roomId;

async function joinRoom() {
  roomId = document.getElementById("roomInput").value;
  socket.emit("join", roomId);

  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  document.getElementById("localVideo").srcObject = localStream;

  peer = new RTCPeerConnection();

  localStream.getTracks().forEach(track => peer.addTrack(track, localStream));

  peer.ontrack = event => {
    document.getElementById("remoteVideo").srcObject = event.streams[0];
  };

  peer.onicecandidate = event => {
    if (event.candidate) {
      socket.emit("ice-candidate", { candidate: event.candidate });
    }
  };
}

socket.on("user-joined", async () => {
  const offer = await peer.createOffer();
  await peer.setLocalDescription(offer);
  socket.emit("offer", offer);
});

socket.on("offer", async offer => {
  await peer.setRemoteDescription(offer);
  const answer = await peer.createAnswer();
  await peer.setLocalDescription(answer);
  socket.emit("answer", answer);
});

socket.on("answer", answer => {
  peer.setRemoteDescription(answer);
});

socket.on("ice-candidate", data => {
  peer.addIceCandidate(new RTCIceCandidate(data.candidate));
});
