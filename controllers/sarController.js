const { getSucursalesbyUser } = require('../db/sucursalUsuarioSvc');


const getDatosSAR = async (req, res) => {
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

        return res.status(200).json({ datosSAR });

    } catch (error) {
        console.error('Error en el proceso:', error);
        return res.status(500).json({ message: 'Error al obtener los datos de la SAR', error: error.message });
    }
  };
  
  module.exports = { getDatosSAR };