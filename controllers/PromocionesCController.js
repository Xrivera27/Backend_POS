const TABLA_CATEGORIA_PROMOCION = 'categoria_promocion';
const TABLA_CATEGORIA = 'categoria_producto';
const { getEmpresaId } = require('../db/EmpresaSvc');

const getCategoriasPromocionEmpresa = async (req, res) => {
    const supabase = req.supabase;
    const id_usuario = req.user.id_usuario;

    try {
        const id_empresa = await getEmpresaId(id_usuario, supabase);
        if (!id_empresa) {
            return res.status(404).json({ error: 'No se encontró la empresa asociada al usuario' });
        }

        // Obtener categorías de la empresa
        const { data: categorias, error: catError } = await supabase
            .from(TABLA_CATEGORIA)
            .select('*')
            .eq('id_empresa', id_empresa);

        if (catError) throw catError;
        if (!categorias?.length) return res.status(200).json([]);

        const categoriasIds = categorias.map(c => c.id_categoria);

        // Obtener promociones de categorías
        const { data: promociones, error: promError } = await supabase
            .from(TABLA_CATEGORIA_PROMOCION)
            .select('*')
            .in('categoria_producto_Id', categoriasIds);

        if (promError) throw promError;

        const promocionesConCategorias = promociones.map(promocion => ({
            ...promocion,
            categoria: categorias.find(c => c.id_categoria === promocion.categoria_producto_Id)
        }));

        res.status(200).json(promocionesConCategorias);
    } catch (error) {
        console.error('Error completo:', error);
        res.status(500).json({ error: 'Error al obtener promociones de categorías', details: error.message });
    }
};

const postCategoriaPromocion = async (req, res) => {
    const supabase = req.supabase;
    const id_usuario = req.user.id_usuario;

    try {
        const { categoria_id, nombre_promocion, porcentaje_descuento, fecha_inicio, fecha_final } = req.body;

        if (!categoria_id || !nombre_promocion || !porcentaje_descuento || !fecha_inicio || !fecha_final) {
            return res.status(400).json({ error: 'Todos los campos son obligatorios' });
        }

        const id_empresa = await getEmpresaId(id_usuario, supabase);
        if (!id_empresa) {
            return res.status(404).json({ error: 'No se encontró la empresa asociada al usuario' });
        }

        // Verificar que la categoría pertenece a la empresa
        const { data: categoriaExiste } = await supabase
            .from(TABLA_CATEGORIA)
            .select('id_categoria')
            .eq('id_categoria', categoria_id)
            .eq('id_empresa', id_empresa)
            .single();

        if (!categoriaExiste) {
            return res.status(400).json({ error: 'La categoría no pertenece a esta empresa o no existe' });
        }

        // Crear la promoción
        const { data: promocion, error } = await supabase
            .from(TABLA_CATEGORIA_PROMOCION)
            .insert({
                categoria_producto_Id: categoria_id,
                nombre_promocion,
                porcentaje_descuento,
                fecha_inicio,
                fecha_final,
                estado: true,
                manejo_manual: false
            })
            .select('*');

        if (error) throw error;

        // Obtener la categoría asociada
        const { data: categoria } = await supabase
            .from(TABLA_CATEGORIA)
            .select('*')
            .eq('id_categoria', categoria_id)
            .single();

        const promocionConCategoria = {
            ...promocion[0],
            categoria
        };

        res.status(200).json([promocionConCategoria]);
    } catch (error) {
        console.error('Error completo:', error);
        res.status(500).json({ error: 'Error al crear promoción de categoría', details: error.message });
    }
};

const patchCategoriaPromocion = async (req, res) => {
    const supabase = req.supabase;
    const id_usuario = req.user.id_usuario;

    try {
        const { id } = req.params;
        const { nombre_promocion, porcentaje_descuento, fecha_inicio, fecha_final } = req.body;

        if (!id) {
            return res.status(400).json({ error: 'ID de promoción no proporcionado' });
        }

        const id_empresa = await getEmpresaId(id_usuario, supabase);
        if (!id_empresa) {
            return res.status(404).json({ error: 'No se encontró la empresa asociada al usuario' });
        }

        // Verificar que la promoción existe y obtener su categoría
        const { data: promocionExistente, error: errorBusqueda } = await supabase
            .from(TABLA_CATEGORIA_PROMOCION)
            .select('*')
            .eq('id', id)
            .single();

        if (errorBusqueda || !promocionExistente) {
            return res.status(404).json({ error: 'Promoción no encontrada' });
        }

        // Verificar que la categoría pertenece a la empresa
        const { data: categoria } = await supabase
            .from(TABLA_CATEGORIA)
            .select('id_categoria')
            .eq('id_categoria', promocionExistente.categoria_producto_Id)
            .eq('id_empresa', id_empresa)
            .single();

        if (!categoria) {
            return res.status(403).json({ error: 'No tiene permisos para modificar esta promoción' });
        }

        // Actualizar la promoción
        const { data: promocion, error: errorUpdate } = await supabase
            .from(TABLA_CATEGORIA_PROMOCION)
            .update({
                nombre_promocion,
                porcentaje_descuento,
                fecha_inicio,
                fecha_final
            })
            .eq('id', id)
            .select('*');

        if (errorUpdate) throw errorUpdate;

        res.status(200).json(promocion[0]);
    } catch (error) {
        console.error('Error completo:', error);
        res.status(500).json({ error: 'Error al actualizar promoción de categoría', details: error.message });
    }
};

const cambiarEstadoCategoriaPromocion = async (req, res) => {
    const supabase = req.supabase;
    const id_usuario = req.user.id_usuario;

    try {
        const { id } = req.params;
        const { estado } = req.body;

        if (!id) {
            return res.status(400).json({ error: 'ID de promoción no proporcionado' });
        }

        const id_empresa = await getEmpresaId(id_usuario, supabase);
        if (!id_empresa) {
            return res.status(404).json({ error: 'No se encontró la empresa asociada al usuario' });
        }

        // Verificar que la promoción existe
        const { data: promocionExistente } = await supabase
            .from(TABLA_CATEGORIA_PROMOCION)
            .select('*')
            .eq('id', id)
            .single();

        if (!promocionExistente) {
            return res.status(404).json({ error: 'Promoción no encontrada' });
        }

        // Verificar que la categoría pertenece a la empresa
        const { data: categoria } = await supabase
            .from(TABLA_CATEGORIA)
            .select('id_categoria')
            .eq('id_categoria', promocionExistente.categoria_producto_Id)
            .eq('id_empresa', id_empresa)
            .single();

        if (!categoria) {
            return res.status(403).json({ error: 'No tiene permisos para modificar esta promoción' });
        }

        // Actualizar el estado
        const { data: promocion, error } = await supabase
            .from(TABLA_CATEGORIA_PROMOCION)
            .update({ estado })
            .eq('id', id)
            .select('*');

        if (error) throw error;

        res.status(200).json(promocion[0]);
    } catch (error) {
        console.error('Error completo:', error);
        res.status(500).json({ error: 'Error al cambiar estado de la promoción', details: error.message });
    }
};

const eliminarCategoriaPromocion = async (req, res) => {
    const supabase = req.supabase;
    const id_usuario = req.user.id_usuario;

    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ error: 'ID de promoción no proporcionado' });
        }

        const id_empresa = await getEmpresaId(id_usuario, supabase);
        if (!id_empresa) {
            return res.status(404).json({ error: 'No se encontró la empresa asociada al usuario' });
        }

        // Verificar que la promoción existe
        const { data: promocionExistente } = await supabase
            .from(TABLA_CATEGORIA_PROMOCION)
            .select('*')
            .eq('id', id)
            .single();

        if (!promocionExistente) {
            return res.status(404).json({ error: 'Promoción no encontrada' });
        }

        // Verificar que la categoría pertenece a la empresa
        const { data: categoria } = await supabase
            .from(TABLA_CATEGORIA)
            .select('id_categoria')
            .eq('id_categoria', promocionExistente.categoria_producto_Id)
            .eq('id_empresa', id_empresa)
            .single();

        if (!categoria) {
            return res.status(403).json({ error: 'No tiene permisos para eliminar esta promoción' });
        }

        // Eliminar la promoción
        const { error } = await supabase
            .from(TABLA_CATEGORIA_PROMOCION)
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.status(200).json({ message: 'Promoción de categoría eliminada correctamente' });
    } catch (error) {
        console.error('Error completo:', error);
        res.status(500).json({ error: 'Error al eliminar promoción de categoría', details: error.message });
    }
};

const getCategoriasEmpresa = async (req, res) => {
    const supabase = req.supabase;
    const id_usuario = req.user.id_usuario;

    try {
        const id_empresa = await getEmpresaId(id_usuario, supabase);
        if (!id_empresa) {
            return res.status(404).json({ error: 'No se encontró la empresa asociada al usuario' });
        }

        const { data: categorias, error } = await supabase
            .from(TABLA_CATEGORIA)
            .select('id_categoria, nombre_categoria')
            .eq('id_empresa', id_empresa)
            .eq('estado', true);

        if (error) throw error;

        res.status(200).json(categorias);
    } catch (error) {
        console.error('Error completo:', error);
        res.status(500).json({ error: 'Error al obtener categorías', details: error.message });
    }
};

module.exports = {
    getCategoriasPromocionEmpresa,
    postCategoriaPromocion,
    patchCategoriaPromocion,
    cambiarEstadoCategoriaPromocion,
    eliminarCategoriaPromocion,
    getCategoriasEmpresa
};