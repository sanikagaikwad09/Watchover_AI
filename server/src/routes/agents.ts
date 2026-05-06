import { Router } from 'express';
import { getAgents } from '../services/agentSimulator.js';

const agentsRouter = Router();

agentsRouter.get('/', (_req, res) => {
  res.json(getAgents());
});

export default agentsRouter;
