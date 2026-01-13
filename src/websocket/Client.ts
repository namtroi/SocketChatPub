import { WebSocket } from 'ws';

export class Client {
  public userId: string;
  public ws: WebSocket;

  constructor(userId: string, ws: WebSocket) {
    this.userId = userId;
    this.ws = ws;
  }

  send(data: any) {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
        console.warn(`User ${this.userId} socket is not open.`);
    }
  }
}