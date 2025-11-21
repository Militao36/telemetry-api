import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import { container } from './container';
import { loadControllers, scopePerRequest } from 'awilix-express';
import { AWILIX_CONTROLLERS, PORT } from './env';
import './queues/bull/index';
import { errorHandler } from './middlewares/errorHandler';

const server = express();

server.use(express.json({ limit: '500mb' }));
server.use(cors());
server.use(scopePerRequest(container));
server.use('/api/v1', loadControllers(AWILIX_CONTROLLERS, { cwd: __dirname }));

server.get('/health', (req, res) => {
  res.status(200).send('OK');
});

server.use(errorHandler);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
