import nodemailer from 'nodemailer';
import fs from 'fs/promises';
import path from 'path';

export async function sendMail(email: string) {
  const transporter = nodemailer.createTransport({
    host: process.env.HOST_AUTH_MAIL,
    port: 465,
    secure: true,
    auth: {
      user: process.env.USER_AUTH_MAIL,
      pass: process.env.PASS_AUTH_MAIL,
    },
  });

  const html = await fs.readFile(path.resolve(__dirname, 'emails', 'bemvindo.html'), 'utf-8');

  const msg = {
    to: email,
    from: 'noreply@unledu.com',
    subject: 'Seja bem vindo',
    text: 'Seja bem vindo',
    html,
  };
  try {
    await transporter.sendMail(msg);
  } catch (error) {
    console.log('Error: send mail', error, email);
  }
}
