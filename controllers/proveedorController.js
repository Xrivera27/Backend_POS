const { insertarRelacion, existeRelacion } = require('../db/empresaProveedorSvc.js');
const { getEmpresaId } = require('../db/empresaSvc.js');

const getProveedores = async (req, res) => {
    const supabase = req.supabase;

    try {
        const { data: proveedor, error } = await supabase
        .from('proveedores')
        .select('*');

        if (error){
            res.status(500).json({ Error: 'Error al obtener Proveedores' + error.message });
        }

        res.status(200).json(proveedor);

    } catch (error) {
        res.status(500).json({ Error: 'Ocurrio un error al obtener Proveedores' + error.message });
    }
}

const getProveedoresbyUsuario = async (req, res) => {
    const supabase = req.supabase;
   try {
    const id_usuario = req.params.id_usuario;
    const id_empresa_param = await getEmpresaId(id_usuario, supabase);

    const { data: proveedores, error } = await supabase.rpc('obtener_proveedores_empresa', {id_empresa_param});

    for (const proveedor of proveedores){
       proveedor.estadoLocal = await filtroProveedoresActivos(proveedor.id, id_empresa_param, supabase);
    }
    if(error){
        return res.status(500);
    }
    
    res.status(200).json(proveedores)
   } catch (error) {
    
   }
}

const filtroProveedoresActivos = async (id_proveedor, id_empresa, supabase) => {
    try {
        const { data: relaciones, error} = await supabase
        .from('empresas_proveedores')
        .select('*')
        .eq('id_proveedor', id_proveedor)
        .eq('id_empresa', id_empresa);

        console.log(relaciones[0]);

        if (error){
            throw error;
        }

        if(relaciones[0].estado){
            return true;
        }

        return false;

    } catch (error) {
        throw error;
    }
}

const postProveedor = async (req, res) => {
    const supabase = req.supabase;
    const { nombre, telefono, correo, direccion } = req.body;
    const id_usuario = req.params.id_usuario;

    try {
        const id_empresa = await getEmpresaId(id_usuario, supabase);
        const { data: proveedor, error } = await supabase.from('proveedores').insert(
            {
            nombre: nombre,
            correo: correo,
            direccion: direccion,
            telefono: telefono,
            estado: true
        }).select('*');

        if(error) {

         return res.status(500).json({error: error.message});
        }
        
       const nuevaRelacion = await insertarRelacion(id_empresa, proveedor[0].id, supabase);

        if (nuevaRelacion != true){

            const borrarProveedor = await deleteProveedor(proveedor[0].id, supabase);

            if (borrarProveedor) return res.status(500).json({error: nuevaRelacion.message});

            else throw new Error('Fallo del servidor');

         }

        res.status(200).json(proveedor);

    } catch (error) {
        console.log('ha habido un error en la api');
        res.status(500).json({error: error.message});
    }
}

const patchProveedor = async (req, res) => {
    const supabase = req.supabase;
    const { nombre, correo, direccion, telefono, id_usuario } = req.body;
    

    const id_proveedor = req.params.id_proveedor;

    try {
        console.log(id_usuario);
        const id_empresa_param = await getEmpresaId(id_usuario, supabase);
        const relacionExistente = await existeRelacion(id_empresa_param, id_proveedor, supabase);

        if (relacionExistente == Error()){
            throw relacionExistente;
        }

        if (relacionExistente == false) {
            throw new Error('Error de seguridad: relación no existente');
       }

        const { data, error } = await supabase.from('proveedores').update(
            {nombre: nombre,
            correo: correo,
            direccion: direccion,
            telefono: telefono
        }).eq('id', id_proveedor);

        if(error) {
         return res.status(500).json({error: error.message});
        }

        res.status(200).json(data);

    } catch (error) {
        console.log('ha habido un error en la api');
        res.status(500).json({error: error.message});
    }
}

const deleteProveedor = async (id_proveedor, supabase) => {
    try {
        const {data, error} = await supabase.from('proveedores').delete().eq('id', id_proveedor);
        
        if(error){
            console.log(error);
            throw error;
        }
        return true;

    } catch (error) {
        throw new Error('Fallo del servidor');
    }
    
}



const desactivarProveedor = async (req, res) => {
    const supabase = req.supabase;
    const { estado, id_usuario } = req.body;
    const id_proveedor = req.params.id_proveedor;

    try {
        const id_empresa_param = await getEmpresaId(id_usuario, supabase);
        const relacionExistente = await existeRelacion(id_empresa_param, id_proveedor, supabase);

        if (relacionExistente == Error()){
            throw relacionExistente;
        }

        if (relacionExistente == false) {
            throw new Error('Error de seguridad: relación no existente');
       }
        const { data, error } = await supabase.from('empresas_proveedores').update(
            {
             estado: estado
        }).eq('id_proveedor', id_proveedor)
        .eq('id_empresa', id_empresa_param);

        if(error) {
         return res.status(500).json({error: error.message});
        }

        res.status(200).json(data);

    } catch (error) {
        console.log('ha habido un error en la api');
        res.status(500).json({error: error.message});
    }
}

module.exports = { getProveedores, getProveedoresbyUsuario, patchProveedor, postProveedor, desactivarProveedor }