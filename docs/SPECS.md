# SPECS.md - SocketChat

## 1. Project Overview

**Goal:** Build a robust real-time chat application supporting Direct and Group messaging.
**Focus:** Mastery of **Native WebSockets**, **Redis** (Presence), and Hybrid Architecture (REST + WS).
**Type:** Solo MVP / Learning Prototype.
**Infrastructure:** No Docker. Local Node.js runtime connecting to **MongoDB Atlas** and **Redis Cloud**.

---

## 2. Tech Stack

### Frontend

- **Framework:** React + TypeScript.
- **State Management:** Pure React State (Context API / Hooks).
- **Styling:** Pure Tailwind CSS.
- **Network:** Native WebSocket API (`window.WebSocket`).

### Backend

- **Runtime:** Node.js + TypeScript.
- **Framework:** Express.js.
- **Real-time:** Native WebSocket library (`ws`).
- **Database:** MongoDB Atlas (Cloud).
- **Cache:** Redis Cloud (Redis Labs).

---

## 3. Functional Requirements

### A. Core Messaging

- **1-1 Chat:** Users can chat directly with existing users from a hardcoded list.
- **Group Chat:** Users can create groups (Max 100 participants) and invite others.
- **Message Format:** Text only.
- **Persistence:** Full chat history saved in MongoDB; accessible across multiple devices.

### B. Message Receipts

- **Status Levels:**

1. **Sent:** Server confirms receipt.
2. **Delivered:** Recipient's socket receives the payload.
3. **Read:** Recipient opens the conversation.

### C. Online Presence

- Real-time updates of Offline/Online status for users in the list.

---

## 4. Database Design (MongoDB)

### Collection: `conversations`

- **Schema:**

```json
{
  "_id": "ObjectId",
  "conversation_type": "GROUP" | "DIRECT",
  "conversation_name": "string", // Optional (for groups)
  "participants": ["string", "string"] // Array of User IDs
}

```

### Collection: `messages`

- **Partition Key:** `conversation_id`
- **Schema:**

```json
{
  "_id": "ObjectId", // Message ID (Unique)
  "conversation_id": "ObjectId",
  "sender_id": "string",
  "content": "string",
  "created_at": "Timestamp"
}
```

---

## 5. API Design (REST)

### A. Send Message

- **Endpoint:** `POST /chat/message`
- **Purpose:** Persist message to DB and trigger WebSocket broadcast.
- **Params:**
- `conversation_id`: string
- `content`: string

- **Response:**

```json
{
  "message_id": "123",
  "timestamp": "00:11:22"
}
```

- **Errors:** 400 (Bad Request), 500 (Internal Server Error).

### B. Get History

- **Endpoint:** `GET /chat/history`
- **Purpose:** Fetch previous messages with cursor-based pagination.
- **Params:**
- `conversation_id`: string
- `limit`: number (default 20)
- `cursor`: string (message_id of the last message seen)

- **Response:**

```json
{
  "history": [
    {
      "_id": "msg_124",
      "sender_id": "user_a",
      "content": "Hello",
      "created_at": "..."
    }
  ],
  "next_cursor": "msg_id_100"
}
```

### C. Create Group Chat

- **Endpoint:** `POST /chat/group`
- **Params:**
- `group_name`: string
- `user_list`: string[] (Array of user IDs)

- **Response:**

```json
{ "conversation_id": "345" }
```

---

## 6. WebSocket Specifications (Native `ws`)

### Connection & Auth

- **URL:** `ws://localhost:PORT?userId=USER_ID`
- **Logic:** On connection, the server associates the `ws` client with the `userId`.

### Event Payloads (JSON Stringified)

**1. Server Client: `NEW_MESSAGE**`

- Triggered when `POST /chat/message` is successful. Server pushes to all active sockets in the conversation.

```json
{
  "type": "NEW_MESSAGE",
  "payload": {
    "conversation_id": "123",
    "message_id": "msg_001",
    "sender_id": "user_a",
    "content": "Hello world",
    "created_at": "timestamp"
  }
}
```

**2. Server Client: `PRESENCE_UPDATE**`

- Triggered via Redis Heartbeat logic.

```json
{
  "type": "PRESENCE_UPDATE",
  "payload": {
    "user_id": "user_b",
    "status": "ONLINE" | "OFFLINE"
  }
}

```

**3. Client Server: `HEARTBEAT**`

- Sent every 5 seconds by the client.

```json
{ "type": "HEARTBEAT" }
```

**4. Client Server: `READ_RECEIPT` (Optional extension)**

- Sent when user opens a chat.

```json
{
  "type": "READ_receipt",
  "payload": {
    "conversation_id": "123",
    "message_id": "msg_001"
  }
}
```

---

## 7. Logic Flow

### Message Flow (Hybrid)

1. **Frontend:** User clicks send.
2. **Frontend:** Calls `POST /chat/message`.
3. **Backend (API):** Validates input Saves to MongoDB `messages` collection.
4. **Backend (API):** Finds active sockets for `participants` in the conversation.
5. **Backend (WS):** Sends `NEW_MESSAGE` event to those sockets.
6. **Frontend:** Receives HTTP 200 (Message Sent status).
7. **Recipient Frontend:** Receives WS `NEW_MESSAGE` (Message Delivered status).

### Presence Flow (Redis)

1. **Frontend:** `setInterval` sends `HEARTBEAT` over WS every 5s.
2. **Backend:** Updates Redis Key `user:{id}:status` `EXPIRE 10s`.
3. **Backend:** Watcher/Interval checks keys or Pub/Sub triggers `PRESENCE_UPDATE` to relevant users.

---

## 8. Hardcoded Data (For Simulation)

To test Groups and Direct chats effectively without a complex User Management system:

**Users:**

- `u1`: Alice
- `u2`: Bob
- `u3`: Charlie
- `u4`: David
