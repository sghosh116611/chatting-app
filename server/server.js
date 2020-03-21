const express = require('express');
const http = require('http');
const path = require('path');
const socketIO = require('socket.io');
const { generateMessage, generateLocationMessage } = require("./utils/message")
const { isRealString } = require("./utils/validation");
const { Users } = require('./utils/users');

var app = express();
const publicPath = path.join(__dirname, "../public");
const port = process.env.PORT || 3000;
var server = http.createServer(app);
var io = socketIO(server);
var user = new Users();


app.use(express.static(publicPath));


io.on("connection", (socket) => {
    console.log("New User is connected!");

    socket.on("join", (params, callback) => {
        if (!isRealString(params.name) || !isRealString(params.room))
            callback("Room or Name is not valid.");

        socket.join(params.room);
        user.removeUser(socket.id);
        user.addUser(socket.id, params.name, params.room);

        io.to(params.room).emit("updateUserList", user.getUserList(params.room));
        socket.emit("newMessage", generateMessage("Admin", "Welcome to the chat User!"));
        socket.broadcast.to(params.room).emit("newMessage", generateMessage("Admin", `${params.name} has joined the chat!`));
        callback();
    });

    socket.on("createMessage", (message, callback) => {
        var person = user.getUser(socket.id);

        if (person && isRealString(message.text)) {
            io.to(person.room).emit("newMessage", generateMessage(person.name, message.text));
        }

        callback();
    });

    socket.on("geolocationMessage", (coords) => {
        var person = user.getUser(socket.id);

        if (person) {
            io.to(person.room).emit("newLocationMessage", generateLocationMessage(`${person.name}`, coords.lat, coords.long));
        }
    });



    socket.on("disconnect", () => {
        var person = user.removeUser(socket.id);
        if (person) {
            io.to(person.room).emit("updateUserList", user.getUserList(person.room));
            io.to(person.room).emit("newMessage", generateMessage("Admin", `${person.name} has left the room`));
        }
    });


});



server.listen(port, () => {
    console.log("Server is up and running!");
});