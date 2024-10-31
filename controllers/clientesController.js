const { insertarRelacion, existeRelacion } = require('../db/empresaClienteSvc.js');
const { getEmpresaId } = require('../db/empresaSvc.js');

// Obtener todos los clientes
const getClientes = async (req, res) => {
    const supabase = req.supabase;
    try {
        const { data: clientes, error } = await supabase
            .from('Clientes')
            .select('*');

        if (error) {
            return res.status(500).json({ Error: 'Error al obtener Clientes: ' + error.message });
        }

        res.status(200).json(clientes);
    } catch (error) {
        res.status(500).json({ Error: 'Ocurrió un error al obtener Clientes: ' + error.message });
    }
};

// Obtener clientes de la empresa de un usuario específico
const getClientesByUsuario = async (req, res) => {
    const supabase = req.supabase;
    try {
        const id_usuario = req.params.id_usuario;
        const id_empresa = await getEmpresaId(id_usuario, supabase);

        // Obtener clientes directamente filtrando por id_empresa
        const { data: clientes, error } = await supabase
            .from('Clientes')
            .select('*')
            .eq('id_empresa', id_empresa)
            .eq('estado', true);  // Filtrar por el ID de la empresa

        if (error) {
            return res.status(500).json({ Error: 'Error al obtener Clientes por Usuario: ' + error.message });
        }

        res.status(200).json(clientes);
    } catch (error) {
        res.status(500).json({ Error: 'Ocurrió un error al obtener Clientes por Usuario: ' + error.message });
    }
};

// Agregar un cliente
const postCliente = async (req, res) => {
    const supabase = req.supabase;
    const { nombre_completo, telefono, correo, direccion, rtn } = req.body;
    const id_usuario = req.params.id_usuario;

    try {
        const id_empresa = await getEmpresaId(id_usuario, supabase);
        const { data: cliente, error } = await supabase
            .from('Clientes')
            .insert({
                nombre_completo: nombre_completo,
                correo: correo,
                direccion: direccion,
                telefono: telefono,
                rtn: rtn,
                id_empresa: id_empresa  // Asegurarse de asociar el cliente a la empresa
            })
            .select('*');

        if (error) {
            return res.status(500).json({ Error: 'Error al crear Cliente: ' + error.message });
        }

        res.status(200).json(cliente);
    } catch (error) {
        res.status(500).json({ Error: 'Ocurrió un error al crear Cliente: ' + error.message });
    }
};

const patchCliente = async (req, res) => {
    const supabase = req.supabase;
    const { nombre_completo, correo, direccion, telefono, rtn } = req.body;

    try {
        const id_cliente = req.params.id_cliente;

        // Actualizar el cliente usando el id_cliente obtenido
        const { data, error } = await supabase
            .from('Clientes')
            .update({
                nombre_completo,
                correo,
                direccion,
                telefono,
                rtn
            })
            .eq('id_cliente', id_cliente);

        if (error) {
            return res.status(500).json({ Error: 'Error al actualizar Cliente: ' + error.message });
        }

        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ Error: 'Ocurrió un error al actualizar Cliente: ' + error.message });
    }
}

const desactivarCliente = async (req, res) => {
    const supabase = req.supabase;
    const { estado } = req.body;
    const id_cliente = req.params.id_cliente;

    try {
        const { data, error } = await supabase.from('Clientes').update(
            {
             estado: estado
        }).eq('id_cliente', id_cliente);

        if(error) {
         return res.status(500).json({error: error.message});
        }

        res.status(200).json(data);

    } catch (error) {
        console.log('ha habido un error en la api');
        res.status(500).json({error: error.message});
    }
}



// Eliminar cliente
const deleteCliente = async (id_cliente, supabase) => {
    try {
        const { data, error } = await supabase
            .from('Clientes')
            .delete()
            .eq('id', id_cliente);

        if (error) {
            throw error;
        }

        return true;
    } catch (error) {
        throw new Error('Fallo del servidor al eliminar Cliente');
    }
};

module.exports = {
    getClientes,
    getClientesByUsuario,
    postCliente,
    patchCliente,
    desactivarCliente,
    deleteCliente
};
