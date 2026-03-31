"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMail = sendMail;
const nodemailer_1 = __importDefault(require("nodemailer"));
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
async function sendMail(email) {
    const transporter = nodemailer_1.default.createTransport({
        host: process.env.HOST_AUTH_MAIL,
        port: 465,
        secure: true,
        auth: {
            user: process.env.USER_AUTH_MAIL,
            pass: process.env.PASS_AUTH_MAIL,
        },
    });
    const html = await promises_1.default.readFile(path_1.default.resolve(__dirname, 'emails', 'bemvindo.html'), 'utf-8');
    const msg = {
        to: email,
        from: 'noreply@unledu.com',
        subject: 'Seja bem vindo',
        text: 'Seja bem vindo',
        html,
    };
    try {
        await transporter.sendMail(msg);
    }
    catch (error) {
        console.log('Error: send mail', error, email);
    }
}
