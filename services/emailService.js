const nodemailer = require('nodemailer');

// Configura el transporte de correo
const transporter = nodemailer.createTransport({
  service: 'gmail', // Servicio de Gmail
  auth: {
    user: process.env.EMAIL_USER,  // Variable de entorno
    pass: process.env.EMAIL_PASS,  // Variable de entorno
  },
});

// Verificar que el transporte esté configurado correctamente
transporter.verify(function(error, success) {
  if (error) {
    console.log('Error con el transporte de nodemailer:', error);
  } else {
    console.log('Servidor listo para enviar correos');
  }
});

// Función para enviar correos
const sendEmail = async (mailOptions) => {
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Correo enviado: %s', info.messageId);
  } catch (error) {
    console.error('Error enviando el correo:', error);
    throw error; // Reenviamos el error para manejarlo donde se llame
  }
};

module.exports = { sendEmail };
