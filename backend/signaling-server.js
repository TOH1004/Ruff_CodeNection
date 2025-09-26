// signaling-server.js
const WebSocket = require('ws');

const PORT = process.env.PORT || 8080;
const wss = new WebSocket.Server({ port: PORT });

// Store rooms and their clients
const rooms = new Map();

console.log(`✅ Signaling server starting on port ${PORT}`);

// Heartbeat to keep connections alive
function heartbeat() {
  this.isAlive = true;
}

wss.on('connection', (ws, request) => {
  ws.isAlive = true;
  ws.on('pong', heartbeat);
  
  const clientId = generateClientId();
  ws.clientId = clientId;
  
  console.log(`🔗 New client connected: ${clientId}`);
  
  // Send welcome message
  ws.send(JSON.stringify({
    type: 'connected',
    clientId: clientId,
    message: 'Connected to signaling server'
  }));

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log(`📨 Message from ${clientId}:`, data.type);
      
      handleMessage(ws, data);
    } catch (error) {
      console.error('❌ Error parsing message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid JSON format'
      }));
    }
  });

  ws.on('close', () => {
    console.log(`🔌 Client disconnected: ${clientId}`);
    // Remove client from all rooms
    rooms.forEach((clients, roomId) => {
      const index = clients.findIndex(client => client.ws === ws);
      if (index !== -1) {
        clients.splice(index, 1);
        console.log(`📤 Removed ${clientId} from room ${roomId}`);
        
        // Notify other clients in the room
        broadcastToRoom(roomId, {
          type: 'user-left',
          clientId: clientId
        }, clientId);
        
        // Clean up empty rooms
        if (clients.length === 0) {
          rooms.delete(roomId);
          console.log(`🗑️ Room ${roomId} deleted (empty)`);
        }
      }
    });
  });

  ws.on('error', (error) => {
    console.error(`❌ WebSocket error for ${clientId}:`, error);
  });
});

function handleMessage(ws, data) {
  const { type, room } = data;
  
  switch (type) {
    case 'join-room':
      joinRoom(ws, room || 'default-room');
      break;
      
    case 'offer':
    case 'answer':
    case 'candidate':
      forwardSignalingMessage(ws, data);
      break;
      
    case 'leave-room':
      leaveRoom(ws, room || 'default-room');
      break;
      
    default:
      console.log(`⚠️ Unknown message type: ${type}`);
      ws.send(JSON.stringify({
        type: 'error',
        message: `Unknown message type: ${type}`
      }));
  }
}

function joinRoom(ws, roomId) {
  // Initialize room if it doesn't exist
  if (!rooms.has(roomId)) {
    rooms.set(roomId, []);
  }
  
  const roomClients = rooms.get(roomId);
  
  // Check if client is already in the room
  const existingClient = roomClients.find(client => client.ws === ws);
  if (existingClient) {
    console.log(`⚠️ Client ${ws.clientId} already in room ${roomId}`);
    return;
  }
  
  // Add client to room
  roomClients.push({
    ws: ws,
    clientId: ws.clientId,
    joinedAt: new Date()
  });
  
  ws.currentRoom = roomId;
  
  console.log(`📥 Client ${ws.clientId} joined room ${roomId} (${roomClients.length} total)`);
  
  // Notify client they joined successfully
  ws.send(JSON.stringify({
    type: 'joined-room',
    room: roomId,
    clientsInRoom: roomClients.length,
    yourClientId: ws.clientId
  }));
  
  // Notify other clients in the room
  broadcastToRoom(roomId, {
    type: 'user-joined',
    clientId: ws.clientId,
    clientsInRoom: roomClients.length
  }, ws.clientId);
}

function leaveRoom(ws, roomId) {
  const roomClients = rooms.get(roomId);
  if (!roomClients) {
    return;
  }
  
  const index = roomClients.findIndex(client => client.ws === ws);
  if (index !== -1) {
    roomClients.splice(index, 1);
    console.log(`📤 Client ${ws.clientId} left room ${roomId}`);
    
    // Notify other clients
    broadcastToRoom(roomId, {
      type: 'user-left',
      clientId: ws.clientId,
      clientsInRoom: roomClients.length
    }, ws.clientId);
    
    // Clean up empty rooms
    if (roomClients.length === 0) {
      rooms.delete(roomId);
      console.log(`🗑️ Room ${roomId} deleted (empty)`);
    }
  }
  
  ws.currentRoom = null;
}

function forwardSignalingMessage(senderWs, data) {
  const { room } = data;
  const roomId = room || 'default-room';
  
  console.log(`🔄 Forwarding ${data.type} in room ${roomId}`);
  
  // Forward to all other clients in the same room
  broadcastToRoom(roomId, data, senderWs.clientId);
}

function broadcastToRoom(roomId, message, excludeClientId = null) {
  const roomClients = rooms.get(roomId);
  if (!roomClients) {
    console.log(`⚠️ Room ${roomId} not found for broadcast`);
    return;
  }
  
  let sentCount = 0;
  roomClients.forEach(client => {
    if (client.clientId !== excludeClientId && client.ws.readyState === WebSocket.OPEN) {
      try {
        client.ws.send(JSON.stringify(message));
        sentCount++;
      } catch (error) {
        console.error(`❌ Error sending to ${client.clientId}:`, error);
      }
    }
  });
  
  console.log(`📡 Broadcast ${message.type} to ${sentCount} clients in room ${roomId}`);
}

function generateClientId() {
  return 'client_' + Math.random().toString(36).substr(2, 9);
}

// Ping clients every 30 seconds to keep connections alive
const pingInterval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) {
      console.log(`💀 Terminating dead connection: ${ws.clientId}`);
      return ws.terminate();
    }
    
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

// Cleanup on server shutdown
wss.on('close', () => {
  clearInterval(pingInterval);
});

// Log server stats every minute
setInterval(() => {
  console.log(`📊 Server Stats: ${wss.clients.size} clients, ${rooms.size} rooms`);
}, 60000);