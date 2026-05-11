import cors from 'cors';
import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import actionsRouter from './routes/actions.js';
import agentsRouter from './routes/agents.js';
import { registerAgentSocket } from './sockets/agentSocket.js';

const app = express();
const server = createServer(app);
const allowedOrigins = ['http://localhost:5173', 'http://localhost:5176'];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);
app.use(express.json());

app.use('/api/agents', agentsRouter);
app.use('/api/actions', actionsRouter);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
  },
});

registerAgentSocket(io);

const PORT = 4000;
server.listen(PORT);
