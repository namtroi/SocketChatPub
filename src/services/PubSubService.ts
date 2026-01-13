import { redisClient } from '../config/redis';

class PubSubService {
  private subscriber;
  private publisher;

  constructor() {
    // Publisher uses the existing main client
    this.publisher = redisClient;
    
    // Subscriber needs a dedicated connection
    this.subscriber = redisClient.duplicate();

    this.subscriber.on('error', (err) => console.error('Redis Subscriber Error:', err));
    
    // Connect the subscriber immediately
    this.init();
  }

  private async init() {
    try {
        await this.subscriber.connect();
        console.log('Redis Subscriber Connected');
    } catch (err) {
        console.error('Failed to connect Redis Subscriber:', err);
    }
  }

  /**
   * Publish a message to a specific channel
   * @param channel The channel name, e.g., 'global_chat' or 'user:123'
   * @param message The message payload (object or string)
   */
  async publish(channel: string, message: any): Promise<number> {
    const payload = typeof message === 'string' ? message : JSON.stringify(message);
    return await this.publisher.publish(channel, payload);
  }

  /**
   * Subscribe to a channel
   * @param channel The channel name
   * @param callback The function to call when a message is received
   */
  async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
    await this.subscriber.subscribe(channel, (message) => {
      callback(message);
    });
  }

  /**
   * Unsubscribe from a channel (Optional but good practice)
   */
  async unsubscribe(channel: string): Promise<void> {
      await this.subscriber.unsubscribe(channel);
  }
}

export const pubSubService = new PubSubService();
