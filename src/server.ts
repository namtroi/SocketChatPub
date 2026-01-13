import { createServer } from 'http'; // [NEW]
import { WebSocketServer, WebSocket } from 'ws'; // [NEW]
import app from './app';
import dotenv from 'dotenv';
import { connectRedis } from './config/redis';
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

    wss.on('connection', (ws) => {
        console.log('New WebSocket connection initiated');
        
        ws.on('message', (message) => {
            console.log('Received:', message.toString());
            ws.send(`Echo: ${message}`);
        });
    });

    httpServer.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`WebSocket server is ready`);
    });
};

startServer();