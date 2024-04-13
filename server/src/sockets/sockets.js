const socketIO = require("socket.io");

function handleConnection(socket) {
    const clientIp = socket.handshake.address;

    socket.on('login', (userId) => handleLogin(socket, userId, clientIp));
    socket.on('logout', (userId) => handleLogout(socket, userId, clientIp));
    
    socket.on('friendRequest', (data) => handleFriendRequest(socket, data, clientIp));

    socket.on('joinGame', (body) => handleJoinGame(socket, body.gameId, body.user, clientIp));
    socket.on('disconnectGame', (body) => handleDisconnectGame(socket, body.gameId, body.user, clientIp));
    
    socket.on('joinChat', (chatId) => handleJoinChat(socket, chatId, clientIp));
    socket.on('sendChatMessage', (body) => handleSendChatMessage(socket, body.chatId, body.message, body.user, body.timestamp));
    socket.on('exitChat', (chatId) => handleExitChat(socket, chatId, clientIp));
}

// Sesión de usuario
function handleLogin(socket, userId, clientIp) {
    socket.join(userId);
    console.log(`Usuario ${userId} se ha unido al juego`);
}

function handleLogout(socket, userId, clientIp) {
    socket.leave(userId);
    console.log(`Usuario ${userId} se ha desconectado del juego`);
}

// Partidas
function handleJoinGame(socket, gameId, user, clientIp) {
    socket.join(gameId);
    socket.to(gameId).emit('userJoined', user);
    console.log(`Usuario se unió a la partida ${gameId}`);
}

function handleDisconnectGame(socket, gameId, user, clientIp) {
    socket.leave(gameId);
    socket.to(gameId).emit('userDisconnected', user);
    console.log(`Usuario desconectado de la partida ${gameId}`);
}

// Chats
function handleJoinChat(socket, chatId, clientIp) {
    socket.join(chatId);
    console.log(`Usuario se unió al chat ${chatId}`);
}

function handleSendChatMessage(socket, chatId, message, user, timestamp) {
    socket.to(chatId).emit('chatMessage', message, user, timestamp, chatId);
    console.log(`Mensaje enviado en chat ${chatId}: ${message}`);
}

function handleExitChat(socket, chatId, clientIp) {
    socket.leave(chatId);
    console.log(`Usuario ha salido del chat ${chatId}`);
}

// Amigos
function handleFriendRequest(socket, data, clientIp) {
    socket.to(data.userId).emit('friendRequest', data.notification, data.userId);
    console.log(`Notificación de solicitud de amistad enviada a ${data.userId}`);
}

// Notificaciones de test

function notifyGame(io, gameId, notification) {
    io.to(gameId).emit('gameNotification', notification);
    console.log(`Notificación de juego enviada a la partida ${gameId}`);
}

function notifyChat(io, chatId, notification) {
    io.to(chatId).emit('chatNotification', notification);
    console.log(`Notificación de chat enviada al chat ${chatId}`);
}

function countParticipants(io, roomId) {
    const room = io.sockets.adapter.rooms.get(roomId);
    if (room) {
        const participantCount = room.size;
        console.log(`Número de participantes en la sala ${roomId}: ${participantCount}`);
    } else {
        console.log(`La sala ${roomId} no existe o no tiene participantes.`);
    }
}



function setupSocket(server) {
    const io = socketIO(server, {
        cors: {
            origin: "*", // permitiremos más adelante solo unos puertos específicos
            methods: ["GET", "POST"]
        }
    });

    io.on('connection', handleConnection);

    /*setInterval(() => {
        notifyGame(io, 'game123', '¡Bienvenidos a la partida game123!');

    }, 10000);

    setInterval(() => {
        notifyGame(io, 'caballo', 'caballo');
    }, 15000);

    setInterval(() => {
        notifyChat(io, 'chat123', '¡Bienvenidos al chat chat123!');
        countParticipants(io, 'chat123');
    }, 10000);*/
}

module.exports = setupSocket;