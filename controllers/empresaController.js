// Controlador para registrar una empresa
const nodemailer = require('nodemailer');
const register = async (req, res) => {
  const {
    nombre,
    nombre_usuario,
    rtn,
    apellido_usuario,
    id_categoria,
    correo_principal,
    telefono_principal,
    usa_SAR
  } = req.body;

  const supabase = req.supabase;

  try {
    // Insertar en la tabla "Empresas"
    const {
      data: empresa,
      error: empresaError
    } = await supabase
      .from('Empresas')
      .insert([{
        nombre: nombre,
        id_categoria: id_categoria,
        rtn: rtn,
        correo_principal: correo_principal,
        telefono_principal: telefono_principal,
        usa_SAR: usa_SAR
      }])
      .select('id_empresa');

      const correo_perdomo = 'perdomoyasociados.registro@gmail.com';

    if (empresaError) {
      return res.status(500).json({
        error: 'Error al registrar la empresa: ' + empresaError.message
      });
    }

    const { data: sucursal, error: sucursalError } = await supabase.from('Sucursales')
    .insert({
      nombre_administrativo: `${nombre} Sucursal Principal`,
      id_empresa: empresa[0].id_empresa,
      correo: correo_principal,
      direccion: `EDITAR`,
      telefono: telefono_principal,
      estado: true
    }).select('id_sucursal');

    if (sucursalError) {
      console.log(sucursalError);
      return res.status(500).json({
        error: 'Error al registrar la sucursal principal: ' + sucursalError.message
      });
    }

    const dato_usuarios = {
      nombre_usuario: nombre_usuario,
      apellido_usuario: apellido_usuario,
      correo: correo_principal,
      telefono_principal: telefono_principal,
      id_sucursal: sucursal[0].id_sucursal
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: correo_perdomo,
      subject: 'Solicitud de registro de nueva empresa',
      text: `Estimado(a),\n\nPor favor, proceda a registrar al usuario en el sistema utilizando los datos proporcionados a continuación:\n\nNombre: ${dato_usuarios.nombre_usuario}\nApellido: ${dato_usuarios.apellido_usuario}\nCorreo Electrónico: ${dato_usuarios.correo}\nTeléfono: ${dato_usuarios.telefono_principal}\nID de Sucursal Principal: ${dato_usuarios.id_sucursal}\n\nAgradecemos que confirme el registro una vez completado. Si tiene alguna duda o requiere asistencia durante el proceso, no dude en contactarnos.\n\nAtentamente,\nEl equipo de soporte.\n`

    };

    // Enviar el correo
    await transporter.sendMail(mailOptions);
    res.status(200).json({
      message: 'Se envio solictud de registro de empresa.'
    })


  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: 'Error inesperado al registrar la empresa'
    });
  }
};

module.exports = {
  register,
}