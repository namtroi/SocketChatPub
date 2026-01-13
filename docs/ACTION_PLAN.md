# SocketChat Action Plan

This document outlines the step-by-step plan to implement SocketChat based on `docs/SPECS.md` and `mocks/API_CONTRACT.md`.

## Phase 1: Backend Scaffolding & REST API
**Goal:** Establish the Express server, MongoDB connection, and implement the REST endpoints based on the contract.

### Checklist
- [x] **Project Setup**
    - [x] `npm init` and install dependencies: `express`, `mongoose`, `dotenv`, `cors`, `helmet`.
    - [x] Setup TypeScript configuration (`tsconfig.json`).
    - [x] Create folder structure: `src/{controllers, models, routes, services, config}`.
- [x] **Database (MongoDB)**
    - [x] Setup `mongoose` connection logic.
    - [x] Create `User` schema (for hardcoded simulation).
    - [x] Create `Conversation` schema.
    - [x] Create `Message` schema.

- [x] **REST Implementation**
    - [x] Implement `POST /chat/group` (Create Group).
    - [x] Implement `POST /chat/message` (Send Message logic - DB part only).
    - [x] Implement `GET /chat/history` (Pagination logic).
    - [x] **Verification**: Test endpoints with Postman/curl.

## Phase 2: Real-time Layer (Redis + WebSocket)
**Goal:** Implement the WebSocket server for real-time messaging and presence using Redis for state/pub-sub.

### Checklist
- [x] **Redis Setup**
    - [x] Install `redis` (client).
    - [x] Create Redis Client singleton.
    - [x] Implement Pub/Sub helper classes.
- [x] **WebSocket Server**
    - [x] Install `ws` library.
    - [x] Initialize `WebSocketServer` attached to HTTP server.
    - [x] Implement `Client` class to wrap `ws` connection with `userId`.
- [x] **Messaging Logic**
    - [x] Connect `POST /chat/message` to WebSocket Broadcaster.
    - [x] Implement `NEW_MESSAGE` event broadcast.
- [x] **Presence/Heartbeat System**
    - [x] Implement `HEARTBEAT` handler.
    - [x] Redis keys: `SET user:{id}:online "1" EX 10`.
    - [x] Implement Presence Monitoring (Interval or Keyspace Notifications) to trigger `PRESENCE_UPDATE`.

## Phase 3: Frontend Implementation
**Goal:** Build the React application, integrating the API and WebSocket.

### Checklist
- [x] **Setup**
    - [x] Create Vite project (`react-ts`).
    - [x] Setup Tailwind CSS.
- [x] **State Management**
    - [x] Create `AuthContext` (Hardcoded login).
    - [x] Create `SocketContext` (Manage WS connection).
    - [x] Create `ChatContext` (Store messages/conversations).
- [ ] **UI Components**
    - [ ] `Sidebar`: List Users/Groups + Presence Indicators.
    - [ ] `ChatWindow`: Message List + Input.
    - [ ] `LoginModal`: Selector for test users.
- [ ] **Integration**
    - [ ] Fetch history on conversation select.
    - [ ] Handle `NEW_MESSAGE` WS event (append to list).
    - [ ] Handle `PRESENCE_UPDATE` WS event (update sidebar).
    - [ ] Send Heartbeats every 5s.

## Phase 4: Polish & Deployment
**Goal:** Final testing and cleanup.

### Checklist
- [ ] **Error Handling**: Graceful reconnection logic for WS.
- [ ] **Edge Cases**: Empty messages, huge history loading.
- [ ] **Documentation**: Update `README.md`.
