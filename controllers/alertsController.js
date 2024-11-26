const { getRolByUsuario } = require('../db/validaciones.js');
const { getAlertCeo, getAlertAmdministrador } = require('../db/alerts.js');


const getAlertas = async (req, res) => {

    const supabase = req.supabase;
    const id_usuario = req.params.id_usuario;

    try {
        const id_rol_usuario = await getRolByUsuario(id_usuario,supabase);

        if(id_rol_usuario === 4){
            const { alertas, error } = await getAlertCeo(id_usuario, supabase);
            
            if(error){
                throw 'Ocurrio un error al obtener las alertas';
            }

            if(alertas.length === 0){
               return res.status(200).json({
                    message: 'Aun no hay alertas para esta empresa.'
                });
            }

            return res.status(200).json(alertas);
        }
        else if(id_rol_usuario === 1){
            await getAlertAmdministrador(id_usuario, supabase);
          return res.status(200).json({
                message: 'Aun no esta implementado.'
            });
        }

        else {
         throw 'No tiene acceso para ver esta pagina.';       
        }
    } catch (error) {
        console.error('Ocurrio un error: ', error);
        res.status(500).json({
            error: error.message
        })
    }
}

module.exports = { getAlertas }