import { WebSocketServer, WebSocket } from "ws";

const wss = new WebSocketServer({ port: 9000 });



const validRooms = ["room1", "room2", "room3"];
let allSocket= [];

wss.on("connection", (socket) => {
  console.log("New client connected!");

  // Handle incoming messages
  socket.on("message", (message) => {
    console.log("Message received:", message.toString());
    try {
      const parsedMessage = JSON.parse(message.toString());

      // Handle 'join' type message
      if (parsedMessage.type === "join") {
        const roomId = parsedMessage.payload.roomId;

        if (!validRooms.includes(roomId)) {
          console.log(`Invalid Room ID: ${roomId}`);
          socket.send(
            JSON.stringify({
              type: "error",
              payload: { message: "Invalid Room ID" },
            })
          );
          return;
        }

        
        const existingUser = allSocket.find(
          (user) => user.socket === socket && user.room === roomId
        );
        if (existingUser) {
          socket.send(
            JSON.stringify({
              type: "error",
              payload: { message: "You are already in this room" },
            })
          );
          return;
        }

        // Add user to the room
        console.log(`Client joined room: ${roomId}`);
        allSocket.push({ socket, room: roomId });

        socket.send(
          JSON.stringify({
            type: "success",
            payload: { message: `Joined room ${roomId} successfully` },
          })
        );
      }

      // Handle 'chat' type message (broadcast in the same room)
      if (parsedMessage.type === "chat") {
        const currentUser = allSocket.find((user) => user.socket === socket);
        if (!currentUser) return; // If the user is not found, ignore the message

        const currentRoom = currentUser.room;
        console.log(`Broadcasting message in room: ${currentRoom}`);

        allSocket.forEach((user) => {
          if (user.room === currentRoom) {
            user.socket.send(
              JSON.stringify({
                type: "chat",
                payload: {
                  message: parsedMessage.payload.message,
                  isSelf: user.socket === socket,
                },
              })
            );
          }
        });
      }
    } catch (err) {
      console.error("Error processing message:", err);
      socket.send(
        JSON.stringify({
          type: "error",
          payload: { message: "Invalid message format" },
        })
      );
    }
  });

  // Handle client disconnect
  socket.on("close", () => {
    console.log("Client disconnected.");
    allSocket = allSocket.filter((user) => user.socket !== socket);
  });

  // Handle socket errors
  socket.on("error", (err) => {
    console.error("Socket error:", err);
  });
});

console.log("WebSocket server running on port 9000");