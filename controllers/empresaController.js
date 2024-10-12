// Controlador para registrar una empresa
const register = async (req, res) => {
  const {
    nombre,
    created_at,
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
        created_at: created_at,
        id_categoria: id_categoria,
        correo_principal: correo_principal,
        telefono_principal: telefono_principal,
        usa_SAR: usa_SAR
      }])
      .select();

    if (empresaError) {
      return res.status(500).json({
        error: 'Error al registrar la empresa: ' + empresaError.message
      });
    }

    // Respuesta exitosa
    res.status(200).json({
      message: 'Empresa registrada exitosamente',
      empresa
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error inesperado al registrar la empresa'
    });
  }
};



module.exports = {
  register,
}