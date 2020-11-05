require('dotenv').config();
const express = require('express');
const http = require('http');
const app = express();
const server = http.createServer(app);
const socket = require('socket.io');
const io = socket(server);
const path = require('path');
const rooms = {};

io.on('connection', socket => {
    // console.log(socket)
    console.log("New user")
    socket.on("create room", roomId => {
        socket.type = "host";
        socket.roomId = roomId;
        socket.join(roomId);
        rooms[roomId] = socket.id;
    })

    socket.on('join room', roomId => {
        console.log("Join")
        if (rooms[roomId]) {
            socket.join(roomId);
            socket.roomId = roomId;
            socket.emit("hostId",rooms[roomId]);
        } else {
            socket.emit('no room');
        }
    })

    socket.on("offer",data=>{
        data.from = socket.id;
        console.log("Offer");
        io.to(data.to).emit("offer",data);
    })
    socket.on("answer",data=>{
        data.from = socket.id;
        console.log("answer");
        io.to(data.to).emit("answer",data);
    })

    socket.on('ice-candidate',data=>{
        data.from = socket.id;
        io.to(data.to).emit('ice-candidate',{val:data.candidate,userID:socket.id})
    })

    socket.on('disconnect', () => {
        if (socket.roomId) {
            if (socket.type == "host") {
                io.to(socket.roomId).emit("host left");
                rooms[socket.roomId] = null;
            } else {
                io.to(socket.roomId).emit("user left", socket.id);
            }
        }
    })
})


if(process.env.PROD){
    app.use(express.static(path.join(__dirname,'./client/build')))
    app.get('*',(req,res)=>{
        res.sendFile(path.join(__dirname,'./client/build/index.html'))
    })
}    

const port =  process.env.PORT || 8000;
server.listen(port, () => console.log(`Server running on ${port}`))
