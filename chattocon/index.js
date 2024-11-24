import express from 'express';
import http from 'http';
import { fileURLToPath } from 'url';
import {join, dirname} from 'path';
import {Server} from 'socket.io';


const app = express();
const server = http.createServer(app);
const io = new Server(server);


const _dirname = dirname(fileURLToPath(import.meta.url));

  let que = []

io.on('connection',(client)=>{
    console.log("User Connected to server", client.id)

    client.on('connectToChat',()=>{
      console.log(`${client.id} is looking for bebe`)

        if(!que.includes(client.id)){
            que.push(client.id)
            console.log(`${client.id} is on que`)
        }
        if(que.length >=2){
            const [user1, user2] = que.splice(0,2);

            const roomId = `room-${user1}-${user2}`;

           
            io.sockets.sockets.get(user1)?.join(roomId);
            io.sockets.sockets.get(user2)?.join(roomId);

            io.to(roomId).emit('matchFound', { room: roomId });
        }
    })
    client.on('sendMessage',(data)=>{
        if(data.message.trim()===''){
            return
        }
        const roomId = Array.from(client.rooms).find((room)=>room.startsWith('room-'));
        if(roomId){
            io.to(roomId).emit('message', { message: data.message, sender: client.id });
        }
    })

    client.on('disconnect', () => {
        console.log(`User disconnected: ${client.id}`);
        const index = que.indexOf(client.id);
        if (index !== -1) que.splice(index, 1);
        io.emit('queUpdate', que);
    });
})

















app.get('/',(req,res)=>{
    res.sendFile(join(_dirname, 'index.html'))
})

const PORT = 3000;
server.listen(PORT,()=>{
    console.log(`Server is running on ${PORT}`)
})