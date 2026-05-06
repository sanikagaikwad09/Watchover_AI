import { Router } from 'express';
import { getActions } from '../services/agentSimulator.js';

const actionsRouter = Router();

actionsRouter.get('/', (_req, res) => {
  res.json(getActions());
});

export default actionsRouter;
