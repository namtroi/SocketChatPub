import { redisClient } from '../config/redis';

class PubSubService {
  private subscriber;
  private publisher;
  private isConnected = false;
  private connectPromise: Promise<void> | null = null;

  constructor() {
    // Publisher uses the existing main client
    this.publisher = redisClient;
    
    // Subscriber needs a dedicated connection
    this.subscriber = redisClient.duplicate();

    this.subscriber.on('error', (err) => console.error('Redis Subscriber Error:', err));
  }

  /**
   * Ensure subscriber is connected before use
   */
  async ensureConnected(): Promise<void> {
    if (this.isConnected) return;
    
    if (!this.connectPromise) {
      this.connectPromise = this.subscriber.connect().then(() => {
        this.isConnected = true;
        console.log('Redis Subscriber Connected');
      });
    }
    
    await this.connectPromise;
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
    await this.ensureConnected();
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
