const { insertarRelacion, getSucursalesbyUser, getDatosSarSucursal } = require('../db/sucursalUsuarioSvc.js');
const { getEmpresaId } = require('../db/empresaSvc.js');
const { getRolByUsuario } = require('../db/validaciones.js');

const getSucursales = async (req, res) => {
    const supabase = req.supabase;

    try {
        const { data: sucursal, error } = await supabase
        .from('Sucursales')
        .select('*');

        if (error){
            res.status(500).json({ Error: 'Error al obtener Sucursales' + error.message });
        }

        res.status(200).json(sucursal);

    } catch (error) {
        res.status(500).json({ Error: 'Ocurrio un error al obtener Sucursales' + error.message });
    }
}

const getSucursalesbyUsuario = async (req, res) => {
    const supabase = req.supabase;
    const id_usuario_param = req.params.id_usuario;

    try {
        
        console.log(id_usuario_param);
        
        const { data: sucursal, error } = await supabase.rpc('obtener_sucursal', {id_usuario_param})
        

        if (error){
            res.status(500).json({ Error: 'Error al obtener Sucursales' + error.message });
        }

        res.status(200).json(sucursal);

    } catch (error) {
        res.status(500).json({ Error: 'Ocurrio un error al obtener Sucursales' + error.message });
    }
}

const getSucursalesbyUsuarioSummary = async (req, res) => {
    const supabase = req.supabase;
    const id_usuario = req.params.id_usuario

    try {

        const id_rol_usuario = await getRolByUsuario(id_usuario, supabase);

        if ( id_rol_usuario === 4){
            const id_empresa = await getEmpresaId(id_usuario, supabase);

            const { data: sucursales, error } = await supabase
            .from('Sucursales')
            .select('id_sucursal, nombre_administrativo')
            .eq('id_empresa', id_empresa)
            .eq('estado', true);
    
            if (error){
                throw `Ha ocurrido un error: ${error}`;
            }
    
            res.status(200).json(sucursales);
        }

        else {
            const id_sucursal = await getSucursalesbyUser(id_usuario, supabase);
            const { data: sucursales, error } = await supabase
            .from('Sucursales')
            .select('id_sucursal, nombre_administrativo')
            .eq('id_sucursal', id_sucursal)
            .eq('estado', true)

            if (error){
                throw `Ha ocurrido un error: ${error}`;
            }
            console.log(sucursales);
            res.status(200).json(sucursales);
        }
        
    } catch (error) {
        res.status(500).json({ Error: 'Ocurrio un error al obtener Sucursales ' + error });
    }
}

const getSucursalValida = async (req, res) => {
    const id_usuario = req.params.id_usuario;
    const supabase = req.supabase;
    try {
        const datosSARsucursal = await getDatosSarSucursal(id_usuario, supabase);

        if(!datosSARsucursal){
            throw 'Error al obtener datos sucursal o datos desactualizados';
        }
        res.status(200).json({message: 'Datos SAR de sucursal activos'});
    } catch (error) {
        console.log(error);
        res.status(500).json({message: 'Datos SAR de sucursal inactivos'});
    }
}

const patchSucursal = async (req, res) => {
    const supabase = req.supabase;
    const { nombre_administrativo, correo, direccion, telefono } = req.body;

    const id_sucursal = req.params.id_sucursal;

    try {
        const { data, error } = await supabase.from('Sucursales').update(
            {nombre_administrativo: nombre_administrativo,
            correo: correo,
            direccion: direccion,
            telefono: telefono
        }).eq('id_sucursal', id_sucursal);

        if(error) {
         return res.status(500).json({error: error.message});
        }

        res.status(200).json(data);

    } catch (error) {
        console.log('ha habido un error en la api');
        res.status(500).json({error: error.message});
    }
}

const deleteSucursal = async (id_sucursal, supabase) => {
    try {
        const {data, error} = await supabase.from('Sucursales').delete().eq('id_sucursal', id_sucursal);
        
        if(error){
            console.log(error);
            throw error;
        }
        return true;

    } catch (error) {
        throw new Error('Fallo del servidor');
    }
    
}

const postSucursal = async (req, res) => {
    const supabase = req.supabase;
    const { nombre_administrativo, correo, direccion, telefono } = req.body;
   // const id_empresa = req.params.id_empresa;
    const id_usuario = req.params.id_usuario;

    try {
        const id_empresa = await getEmpresaId(id_usuario, supabase);
        const { data: sucursal, error } = await supabase.from('Sucursales').insert(
            {
            id_empresa: id_empresa,
            nombre_administrativo: nombre_administrativo,
            correo: correo,
            direccion: direccion,
            telefono: telefono,
            estado: true
        }).select('*');

        if(error) {
            console.log(error);
         return res.status(500).json({error: error.message});
        }
        
       const nuevaRelacion = await insertarRelacion(id_usuario, sucursal[0].id_sucursal, supabase);

        if (nuevaRelacion != true){
            console.log('entro aqui');
            const borrarSucursal = await deleteSucursal(sucursal[0].id_sucursal, supabase);
            if (borrarSucursal) return res.status(500).json({error: nuevaRelacion.message});
            else throw new Error('Fallo del servidor');
         }

        res.status(200).json(sucursal);

    } catch (error) {
        console.log('ha habido un error en la api');
        res.status(500).json({error: error.message});
    }
}

const desactivarSucursal = async (req, res) => {
    const supabase = req.supabase;
    const { estado } = req.body;
    const id_sucursal = req.params.id_sucursal;

    try {
        const { data, error } = await supabase.from('Sucursales').update(
            {
             estado: estado
        }).eq('id_sucursal', id_sucursal);

        if(error) {
         return res.status(500).json({error: error.message});
        }

        res.status(200).json(data);

    } catch (error) {
        console.log('ha habido un error en la api');
        res.status(500).json({error: error.message});
    }
}

module.exports = { getSucursales, getSucursalesbyUsuario, getSucursalesbyUsuarioSummary,patchSucursal, postSucursal, desactivarSucursal, getSucursalValida }