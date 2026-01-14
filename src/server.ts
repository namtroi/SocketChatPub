import { createServer } from 'http'; // [NEW]
import { WebSocketServer, WebSocket } from 'ws'; // [NEW]
import app from './app';
import dotenv from 'dotenv';
import { connectRedis, redisClient } from './config/redis';
import { pubSubService } from './services/PubSubService';

dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectRedis();

  const httpServer = createServer(app);

  const wss = new WebSocketServer({ server: httpServer });

  await pubSubService.subscribe('chat:message', (message) => {
    console.log('Broadcasting message:', message);
    
    try {
      const parsedMessage = JSON.parse(message);
      const participants = parsedMessage.payload?.participants || [];
      
      wss.clients.forEach((client) => {
        const clientUserId = (client as any).userId;
        // Only send to clients who are participants in the conversation
        if (client.readyState === WebSocket.OPEN && 
            participants.includes(clientUserId)) {
          client.send(message);
        }
      });
    } catch (err) {
      console.error('Error parsing message for broadcast:', err);
    }
  });

    // Subscribe to presence updates
    await pubSubService.subscribe('chat:presence', (message) => {
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    });

    // Polling interval to check online users every 5 seconds
    setInterval(async () => {
        const keys = await redisClient.keys('user:*:online');
        const onlineUsers = keys.map(key => key.split(':')[1]);

        if (onlineUsers.length > 0) {
            await pubSubService.publish('chat:presence', {
                type: 'PRESENCE_UPDATE',
                payload: {
                    onlineUsers  // Wrap in payload to match frontend
                }
            });
        }
    }, 5000);

  wss.on('connection', async (ws, req) => {
    // Parse userId from URL params
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const userId = url.searchParams.get('userId');

    console.log(`New WebSocket connection initiated for User: ${userId}`);

    // Store userId on the websocket instance for later use
    (ws as any).userId = userId;

    // Immediately mark user as online and broadcast presence
    if (userId) {
      await redisClient.set(`user:${userId}:online`, '1', { EX: 10 });
      
      // Broadcast updated online list immediately
      const keys = await redisClient.keys('user:*:online');
      const onlineUsers = keys.map(key => key.split(':')[1]);
      await pubSubService.publish('chat:presence', {
        type: 'PRESENCE_UPDATE',
        payload: { onlineUsers }
      });
    }

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());

        if (message.type === 'HEARTBEAT') {
          // Use the stored userId
          const currentUserId = (ws as any).userId;

          if (currentUserId) {
            await redisClient.set(`user:${currentUserId}:online`, '1', {
              EX: 10,
            });

            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'HEARTBEAT_ACK' }));
            }
          }
        }

        console.log('Received:', message);
      } catch (err) {
        console.error('Invalid message format');
      }
    });

    // Handle disconnect - immediately mark user as offline
    ws.on('close', async () => {
      const currentUserId = (ws as any).userId;
      
      if (currentUserId) {
        console.log(`User ${currentUserId} disconnected`);
        
        // Remove online status from Redis
        await redisClient.del(`user:${currentUserId}:online`);
        
        // Broadcast immediate offline notification
        await pubSubService.publish('chat:presence', {
          type: 'PRESENCE_UPDATE',
          payload: {
            user_id: currentUserId,
            status: 'OFFLINE'
          }
        });
      }
    });
  });

  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`WebSocket server is ready`);
  });
};

startServer();
