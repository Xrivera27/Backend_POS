const { getSucursalesbyUser } = require('../db/sucursalUsuarioSvc');


const getDatoSAR = async (req, res) => {
    const supabase = req.supabase;
    try {
      // Obtener id_usuario del token decodificado en req.user
      const id_usuario = req.user.id_usuario;
      console.log('ID Usuario:', id_usuario);
  
      // Obtener la sucursal a la que pertenece el usuario
      const id_sucursal = await getSucursalesbyUser(id_usuario, supabase);
      console.log('ID Sucursal obtenido:', id_sucursal); 

      if (!id_sucursal) {
        console.error('No se encontró un ID de Sucursal para el usuario:', id_usuario);
        return res.status(404).json({ message: "Sucursal no encontrada para el usuario" });
    }
  
      // Consultar la tabla Datos_SAR con el id_sucursal obtenido
      const { data: datosSAR, error: sarError } = await supabase
        .from('Datos_SAR')
        .select('*')
        .eq('id_sucursal', id_sucursal)
        .single();
  
        if (sarError) {
            console.error('Error al consultar la base de datos:', sarError);
            return res.status(500).json({ message: 'Error al consultar la base de datos', error: sarError });
        }

        if (!datosSAR) {
            console.error('No se encontraron datos para la SAR con ID:', id_sucursal); 
            return res.status(404).json({ message: "Datos de la SAR no encontrados" });
        }

        // Obtener los datos enviados desde el frontend para actualizar
        const { numero_CAI, rango_inicial, rango_final, fecha_autorizacion, fecha_vencimiento} = req.body;
        console.log("Datos recibidos del frontend:", req.body); // Depuración

        // Preparar los datos a actualizar
        let updatedData = {
            numero_CAI: numero_CAI || sar.numero_CAI,
            rango_inicial: rango_inicial || sar.rango_inicial,
            rango_final: rango_final || sar.rango_final,
            fecha_autorizacion: fecha_autorizacion || sar.fecha_autorizacion,
            fecha_vencimiento: fecha_vencimiento || sar.fecha_vencimiento,

           
        };

        // Actualizar los datos en la base de datos
        const { data: updatesar, error: updateError } = await supabase
            .from('Datos_SAR')
            .update(updatedData)
            .eq('id_sucursal', id_sucursal);

        if (updateError) {
            console.error("Error al realizar la actualización:", updateError);
            return res.status(500).json({ message: 'Error al actualizar la empresa', error: updateError });
        }

        return res.status(200).json({ message: 'Empresa actualizada exitosamente', sar: updatesar });
        return res.status(200).json({ datosSAR });

    } catch (error) {
        console.error('Error en el proceso:', error);
        return res.status(500).json({ message: 'Error al obtener los datos de la SAR', error: error.message });
    }

    



  };
  
  module.exports = { getDatoSAR };