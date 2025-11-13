"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const env_1 = require("./env");
require("./queues/bull/index");
const server = (0, express_1.default)();
server.use(express_1.default.json());
server.get('/health', (req, res) => {
    res.status(200).send('OK');
});
server.listen(env_1.PORT, () => {
    console.log(`Server is running on port ${env_1.PORT}`);
});
