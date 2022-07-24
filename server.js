const express = require("express");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const { chats } = require("./data/data");
const messageRoutes = require("./Routes/messageRoutes");
const connectDB = require("./config/db");
const colors = require('colors');
const userRoute = require('./Routes/userroutes');
const chatRoute = require('./Routes/chatRoute');
const { notFound, errorHandler } = require("./middleware/errormiddleware");
const path = require("path");
const app = express();
dotenv.config();
connectDB();
app.use(express.json());
// app.get("/", (req, res) => {
//   res.send("api is runnig");
// })
// app.get("/api/chat", (req, res) => {
//   res.send(chats);
// })
// app.get("/api/chat/:id", (req, res) => {
//   const singlechat = chats.find((c) => c._id === req.params.id);
//   console.log(singlechat);
//   res.send(singlechat);
// })

app.use("/api/user", userRoute);
app.use("/api/chat", chatRoute);
app.use("/api/message", messageRoutes);


// --------------------------deployment------------------------------

// const __dirname1 = path.resolve();

// if (process.env.NODE_ENV === "production") {
//   app.use(express.static(path.join(__dirname1, "/frontend/build")));

//   app.get("*", (req, res) =>
//     res.sendFile(path.resolve(__dirname1, "frontend", "build", "index.html"))
//   );
// } else {
//   app.get("/", (req, res) => {
//     res.send("API is running..");
//   });
// }

// --------------------------deployment------------------------------

app.use(notFound);
app.use(errorHandler);







const PORT = process.env.PORT || 5000
const server = app.listen(PORT, function (req, res) {
  console.log(`server started on port ${PORT}`.yellow.bold);
});
const io = require("socket.io")(server, {
  pingTimeout: 60000,
  cors: {
    origin: "http://localhost:3000",
    // credentials: true,
  },
});
io.on("connection", (socket) => {
  console.log("Connected to socket.io");
  socket.on("setup", (userData) => {
    socket.join(userData._id);
    console.log(userData._id);
    socket.emit("connected");
  });
  socket.on("join chat", (room) => {
    socket.join(room);

    console.log("User Joined Room: " + room);
  });
  socket.on('typing', (room) => { socket.in(room).emit("typing") });
  socket.on('stop typing', (room) => { socket.in(room).emit("stop typing") });
  socket.on("new message", (newMessageRecieved) => {
    var chat = newMessageRecieved.chat;

    if (!chat.users) return console.log("chat.users not defined");

    chat.users.forEach((user) => {
      if (user._id == newMessageRecieved.sender._id) return;

      socket.in(user._id).emit("message recieved", newMessageRecieved);
    });
  });
});
