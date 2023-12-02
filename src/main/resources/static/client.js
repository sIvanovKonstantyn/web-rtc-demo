//connecting to our signaling server
var conn = new WebSocket('ws://localhost:8080/socket');

conn.onopen = function() {
    console.log("Connected to the signaling server");
    initialize();
};

conn.onmessage = function(msg) {
    console.log("Got message", msg.data);
    var content = JSON.parse(msg.data);
    var data = content.data;
    switch (content.event) {
    // when somebody wants to call us
    case "offer":
        handleOffer(data);
        break;
    case "answer":
        handleAnswer(data);
        break;
    // when a remote peer sends an ice candidate to us
    case "candidate":
        handleCandidate(data);
        break;
    default:
        break;
    }
};

function send(message) {
    conn.send(JSON.stringify(message));
}

var localVideo = document.getElementById("selfVideoSpace");
var remoteVideo = document.getElementById("contactVideoSpace");
var localConnection;
var input = document.getElementById("messageInput");

function initialize() {
   navigator.getUserMedia({video: true, audio: false}, function (stream) {
       localVideo.srcObject = stream;
       startPeerConnection(stream);
   }, function (error) {
       alert("Camera capture failed!")
   });
}

function startPeerConnection(stream) {
    var configuration = {
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
    }
    localConnection = new RTCPeerConnection({configuration: configuration, iceServers: []});
    stream.getTracks().forEach(
        function (track) {
            localConnection.addTrack(
                track,
                stream
            );
        }
    );

    localConnection.ontrack = function (e) {
        console.log("ontrack: " + e.streams[0]);
        remoteVideo.srcObject = e.streams[0];
    };
}

function createOffer() {
     localConnection.createOffer()
            .then(offer => {
                send({
                        event : "offer",
                        data : offer
                    });
                localConnection.setLocalDescription(offer);
            })
            .catch(e => {
                console.error(e)
            });
}

function handleOffer(offer) {
    localConnection.setRemoteDescription(offer);

    // create and send an answer to an offer
    localConnection.createAnswer(function(answer) {
        localConnection.setLocalDescription(answer);
        send({
            event : "answer",
            data : answer
        });
    }, function(error) {
        alert("Error creating an answer");
    });
};

function handleCandidate(candidate) {
    localConnection.addIceCandidate(candidate);
    console.log("ice candidate added!!!");
};

function handleAnswer(answer) {
    localConnection.setRemoteDescription(answer);
    console.log("connection established successfully!!");
};

function sendMessage() {
    dataChannel.send(input.value);
    const chatSpace = document.getElementById("chat-space");
    chatSpace.value = chatSpace.value + '\n[me]: ' + input.value;
    input.value = "";
}