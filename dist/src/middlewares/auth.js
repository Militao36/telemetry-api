"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = auth;
exports.generateToken = generateToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../env");
const container_1 = require("../container");
async function auth(req, res, next) {
    const excludes = ['/api/v1/users', '/api/v1/users/auth', '/api/v1/users/reset-password'];
    if (excludes.includes(req.url)) {
        next();
        return;
    }
    const authHeaders = req.headers.authorization;
    if (!authHeaders) {
        return res.status(401).json({ message: 'Access denied' });
    }
    if (authHeaders) {
        const token = authHeaders.split(' ')[1];
        if (['/api/v1/traces', '/api/v1/logs'].includes(req.url) && req.method.toLowerCase() === 'post') {
            const project = await container_1.container.resolve('projectService').findByToken(token);
            const users = await container_1.container.resolve('userService').findAll(project.idEmpresa);
            if (project.token === null || project.token !== token) {
                return res.status(401).json({ message: 'Access denied' });
            }
            if (project.active === false) {
                return res.status(401).json({ message: 'Access denied' });
            }
            if (users.some((u) => u.active === false)) {
                return res.status(401).json({ message: 'Access denied' });
            }
            req.idEmpresa = project.idEmpresa;
            req.idProject = project.id;
            req.idUser = null;
            req.user = null;
            next();
            return;
        }
        jsonwebtoken_1.default.verify(token, env_1.SECRET_JWT, async (error, decoded) => {
            if (error) {
                return res.status(401).json({ message: 'Access denied' });
            }
            const user = await container_1.container.resolve('userService').findByIdWithoutIdEmpresa(decoded.idUser);
            req.idEmpresa = user === null || user === void 0 ? void 0 : user.idEmpresa;
            req.idProject = decoded.idProject;
            req.idUser = user === null || user === void 0 ? void 0 : user.id;
            req.user = user;
            next();
        });
    }
    else {
        return res.status(401).json({ message: 'Access denied' });
    }
}
function generateToken(args) {
    return jsonwebtoken_1.default.sign(args, env_1.SECRET_JWT, {
        expiresIn: 86400 * 30,
    });
}
