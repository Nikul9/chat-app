const http      = require('http')
const socketio  = require('socket.io')
const express   = require('express')
const path      = require('path')
const app       = express()
const DirPath   = path.join(__dirname,'../public')
const port      = process.env.PORT || 3000
const server    = http.createServer(app)
const io        = socketio(server)
const Filter    = require('bad-words')
const {gioMessage} = require('./utils/message')
const {addUser,removeUser, getUser,getUsersInRoom} = require('./utils/user')

app.use(express.static(DirPath))

io.on('connection',(socket) => {
    
    let count = 0;    
    console.log('web socket')
    socket.on('join', ({ username, room },callback) => {
        const {error,user} = addUser({id: socket.id,username,room})
        if(error) {
            return callback(error)
        }
        socket.join(user.room)
        socket.emit('message', gioMessage('Admin','Welcome!'))
        socket.broadcast.to(user.room).emit('message', gioMessage('Admin',`${user.username} has joined!`))
        io.to(user.room).emit('roomData',{
            room : user.room,
            users : getUsersInRoom(user.room)
        })
        callback()
        // socket.emit, io.emit, socket.broadcast.emit
        // io.to.emit, socket.broadcast.to.emit
    })    

    socket.on('sendMessage',(message,callback) => {
        const user = getUser(socket.id)
        const filter  = new Filter()
        const badword  = ['chodu','chutio','bheanchod','lodo','madarchod','dofa',
        'doffa','gand','asshole','boobs','chutiya','fuck','land','loda','madrchod'
        ,'chutiyo','mc','bc']        
        filter.addWords(...badword)
                if(filter.isProfane(message)) {
                    return callback('Profanity not allowed')
                }
            io.to(user.room).emit('message',gioMessage(user.username,message))
            callback()       
        })
        
    socket.on('sendLocation',(position,callback) => {
        const user = getUser(socket.id)
        io.emit('location',gioMessage(user.username,`http://google.com/maps?q=${position.latitude},${position.longitude}`))
        callback()
        
    })
    socket.on('disconnect', () => {
        const user = removeUser(socket.id)
        if(user){
            io.to(user.room).emit('message', gioMessage('Admin',`${user.username} has left!`))
            io.to(user.room).emit('roomData',{
                room : user.room,
                users : getUsersInRoom(user.room)
            })
        }
    })
})
server.listen(port, () => {
    console.log(`you are in port ${port}`)
})