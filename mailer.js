const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendConfirmationEmail(email) {
  await transporter.sendMail({
    from: `"App Suporte" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Senha alterada com sucesso",
    html: `
      <p>Olá,</p>
      <p>A senha da sua conta foi alterada com sucesso.</p>
      <p>Se você não fez essa alteração, entre em contato conosco imediatamente.</p>
    `,
  });
}

async function sendCodeEmail(email, code) {
  await transporter.sendMail({
    from: `"App Suporte" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Seu código de verificação",
    html: `
      <p>Olá,</p>
      <p>Seu código de verificação é: <strong>${code}</strong></p>
      <p>Ele é válido por 10 minutos.</p>
    `,
  });
}

module.exports = {
  sendConfirmationEmail,
  sendCodeEmail,
};
