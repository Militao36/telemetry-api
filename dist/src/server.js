"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const container_1 = require("./container");
const awilix_express_1 = require("awilix-express");
const env_1 = require("./env");
require("./queues/bull/index");
const errorHandler_1 = require("./middlewares/errorHandler");
const auth_1 = require("./middlewares/auth");
const server = (0, express_1.default)();
server.use(express_1.default.json({ limit: '500mb' }));
server.use((0, cors_1.default)());
server.use(auth_1.auth);
server.use((0, awilix_express_1.scopePerRequest)(container_1.container));
server.use('/api/v1', (0, awilix_express_1.loadControllers)(env_1.AWILIX_CONTROLLERS, { cwd: __dirname }));
server.get('/health', (req, res) => {
    res.status(200).send('OK');
});
server.use(errorHandler_1.errorHandler);
server.listen(env_1.PORT, () => {
    console.log(`Server is running on port ${env_1.PORT}`);
});
