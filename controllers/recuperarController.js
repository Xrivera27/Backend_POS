const crypto = require('crypto');
const { supabaseClient } = require('../supabaseClient');
const { sendEmail } = require('../services/emailService'); // Importa tu servicio de email

// Función para generar un token aleatorio
const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

exports.sendPasswordRecoveryEmail = async (req, res) => {
  const { email } = req.body;

  try {
    // Verificar si el email existe en la base de datos
    const { data, error } = await supabaseClient
      .from('Usuarios')
      .select('id_usuario')
      .eq('correo', email)
      .single();

    if (error || !data) {
      return res.status(404).json({ message: 'El correo no está registrado' });
    }

    // Generar el token de recuperación
    const resetToken = generateResetToken();

    // Guardar el token y la fecha de expiración en la base de datos
    await supabaseClient
      .from('Usuarios')
      .update({ reset_token: resetToken, reset_token_expiration: new Date(Date.now() + 3600000) }) // Expira en 1 hora
      .eq('correo', email);

    // Configurar las opciones del correo
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Recuperación de contraseña',
      html: `<p>Haz clic en el siguiente enlace para restablecer tu contraseña:</p>
             <a href="http://localhost:3000/reset-password?token=${resetToken}">Restablecer contraseña</a>`,
    };

    // Enviar el correo usando el servicio
    await sendEmail(mailOptions);

    res.status(200).json({ message: 'Correo de recuperación enviado' });
  } catch (error) {
    console.error('Error general en el proceso:', error.message);
    res.status(500).json({ message: 'Error en el proceso de recuperación de contraseña' });
  }
};

exports.mostrarFormularioRecuperacion = (req, res) => {
    const { token } = req.query;
    
    if (!token) {
      return res.status(400).send('Token de recuperación inválido.');
    }
  
    res.send(`<form method="POST" action="/reset-password">
                <input type="hidden" name="token" value="${token}" />
                <label for="password">Nueva Contraseña:</label>
                <input type="password" name="password" required />
                <button type="submit">Restablecer Contraseña</button>
              </form>`);
  };
  
  // Función para restablecer la contraseña
  exports.restablecerContrasena = async (req, res) => {
    const { token, password } = req.body;
  
    try {
      // Buscar al usuario con el token de recuperación
      const { data, error } = await supabaseClient
        .from('Usuarios')
        .select('id_usuario')
        .eq('reset_token', token)
        .single();
  
      if (error || !data) {
        return res.status(400).json({ message: 'Token inválido o expirado.' });
      }
  
      // Actualizar la contraseña en la base de datos
      const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
      await supabaseClient
        .from('Usuarios')
        .update({ contraseña: hashedPassword, reset_token: null, reset_token_expiration: null })
        .eq('id_usuario', data.id_usuario);
  
      res.status(200).json({ message: 'Contraseña restablecida correctamente.' });
    } catch (error) {
      console.error('Error al restablecer la contraseña:', error);
      res.status(500).json({ message: 'Error al restablecer la contraseña.' });
    }
  };
