"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HashService = void 0;
const crypto_1 = __importDefault(require("crypto"));
class HashService {
    async crypto(password, _salt) {
        return await new Promise((resolve, reject) => {
            const salt = Buffer.from('adasdadsada').toString('hex');
            crypto_1.default.pbkdf2(password, salt, 1000, 64, 'sha512', (err, result) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve({
                    hash: result.toString('hex'),
                    salt
                });
            });
        });
    }
    async compareHash(passowordHash, password, salt) {
        const { hash } = await this.crypto(password, salt);
        return passowordHash === hash;
    }
}
exports.HashService = HashService;
