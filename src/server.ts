import { container } from './container';
import { loadControllers, scopePerRequest } from 'awilix-express';
import express from 'express';
import cors from 'cors';

import { AWILIX_CONTROLLERS, PORT } from './env';
import './queues/bull/index'

const server = express();

server.use(express.json({ limit: '500mb' }));
server.use(cors())
server.use(scopePerRequest(container))
server.use('/api/v1', loadControllers(AWILIX_CONTROLLERS, { cwd: __dirname }))

server.get('/health', (req, res) => {
  res.status(200).send('OK');
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
