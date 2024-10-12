const crypto = require('crypto');
const nodemailer = require('nodemailer');

exports.sendTemporaryPassword = async (req, res) => {
  const { email } = req.body;
  const supabase = req.supabase; // Obtenemos Supabase desde req

  try {
    // Verificar si el usuario existe en la base de datos
    const { data: user, error } = await supabase
      .from('Usuarios')
      .select('*')
      .eq('correo', email)
      .single();

    if (error || !user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Generar una contraseña temporal
    const temporaryPassword = crypto.randomBytes(4).toString('hex');
    const expirationTime = new Date();
    expirationTime.setHours(expirationTime.getHours() + 1); // Contraseña expira en 1 hora

    // Guardar la contraseña temporal como la contraseña del usuario y en reset_token
    const { error: updateError } = await supabase
      .from('Usuarios')
      .update({
        contraseña: temporaryPassword, // Actualizamos la contraseña con la temporal
        reset_token: temporaryPassword, // También la guardamos en reset_token
        reset_token_expiration: expirationTime,
      })
      .eq('id_usuario', user.id_usuario);

    if (updateError) {
      return res.status(500).json({ message: 'Error al guardar la contraseña temporal' });
    }

    // Configurar el envío del correo con Nodemailer
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.correo,
      subject: 'Recuperación de contraseña',
      text: `Hola ${user.nombre},\n\nTu nueva contraseña temporal es: ${temporaryPassword}. Esta contraseña expira en 1 hora.\n\nSaludos, equipo.\n\nRecuerda cambiar tu contraseña al iniciar sesión.`,
    };

    // Enviar el correo
    await transporter.sendMail(mailOptions);

    return res.json({ message: 'Correo enviado con la contraseña temporal.' });
  } catch (err) {
    return res.status(500).json({ message: 'Error interno del servidor', error: err.message });
  }
};
