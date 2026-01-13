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
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
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
                onlineUsers
            });
        }
    }, 5000);

  wss.on('connection', (ws) => {
    console.log('New WebSocket connection initiated');

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());

        if (message.type === 'HEARTBEAT') {
          const userId = message.userId;

          if (userId) {
            await redisClient.set(`user:${userId}:online`, '1', {
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
  });

  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`WebSocket server is ready`);
  });
};

startServer();
