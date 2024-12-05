const { getSucursalesbyUser } = require('../db/sucursalUsuarioSvc');


const createDatosSAR = async (req, res) => {
  const supabase = req.supabase;
  try {
    const id_usuario = req.user.id_usuario;
    const id_sucursal = await getSucursalesbyUser(id_usuario, supabase);

    if (!id_sucursal) {
      return res.status(404).json({ message: "Sucursal no encontrada para el usuario" });
    }

    // Desactivar el registro actual
    const { error: updateError } = await supabase
      .from('Datos_SAR')
      .update({ activo: false })
      .eq('id_sucursal', id_sucursal)
      .eq('activo', true);

    if (updateError) {
      throw updateError;
    }

    // Crear nuevo registro
    const { data: newSAR, error: insertError } = await supabase
      .from('Datos_SAR')
      .insert([
        {
          id_sucursal,
          numero_CAI: req.body.numero_CAI,
          rango_inicial: req.body.rango_inicial,
          rango_final: req.body.rango_final,
          fecha_autorizacion: req.body.fecha_autorizacion,
          fecha_vencimiento: req.body.fecha_vencimiento,
          numero_actual_SAR: req.body.numero_actual_SAR,
          activo: true
        }
      ])
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    return res.status(200).json({ 
      message: 'Datos SAR actualizados correctamente',
      data: newSAR 
    });

  } catch (error) {
    console.error('Error en el proceso:', error);
    return res.status(500).json({ 
      message: 'Error al actualizar los datos SAR', 
      error: error.message 
    });
  }
};

// Modificar el getDatosSAR para solo obtener registros activos
const getDatosSAR = async (req, res) => {
  const supabase = req.supabase;
  try {
    const id_usuario = req.user.id_usuario;
    const id_sucursal = await getSucursalesbyUser(id_usuario, supabase);

    if (!id_sucursal) {
      return res.status(404).json({ message: "Sucursal no encontrada para el usuario" });
    }

    const { data: datosSAR, error: sarError } = await supabase
      .from('Datos_SAR')
      .select('*')
      .eq('id_sucursal', id_sucursal)
      .eq('activo', true)
      .single();

    if (sarError) {
      throw sarError;
    }

    if (!datosSAR) {
      return res.status(404).json({ message: "Datos SAR activos no encontrados" });
    }

    return res.status(200).json({ datosSAR });

  } catch (error) {
    console.error('Error en el proceso:', error);
    return res.status(500).json({ 
      message: 'Error al obtener los datos SAR', 
      error: error.message 
    });
  }
};

module.exports = { getDatosSAR, createDatosSAR };