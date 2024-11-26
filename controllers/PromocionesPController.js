const TABLA_PROMOCIONES = 'Producto_promocion';
const TABLA_PRODUCTO = 'producto';
const { getEmpresaId } = require('../db/empresaSvc');
const { eliminarPromoAlert } = require('../db/alerts');

const getPromocionesEmpresa = async (req, res) => {
    const supabase = req.supabase;
    const id_usuario = req.user.id_usuario;

    try {
        const id_empresa = await getEmpresaId(id_usuario, supabase);
        if (!id_empresa) {
            return res.status(404).json({ error: 'No se encontró la empresa asociada al usuario' });
        }

        const { data: productos, error: prodError } = await supabase
            .from('producto')
            .select('*')
            .eq('id_empresa', id_empresa);

        if (prodError) throw prodError;
        if (!productos?.length) return res.status(200).json([]);

        const productosIds = productos.map(p => p.id_producto);

        const { data: promociones, error: promError } = await supabase
            .from(TABLA_PROMOCIONES)
            .select('*')
            .in('producto_Id', productosIds);

        if (promError) throw promError;

        const promocionesConProductos = promociones.map(promocion => ({
            ...promocion,
            producto: productos.find(p => p.id_producto === promocion.producto_Id)
        }));

        res.status(200).json(promocionesConProductos);
    } catch (error) {
        console.error('Error completo:', error);
        res.status(500).json({ error: 'Error al obtener promociones', details: error.message });
    }
};

const postPromocion = async (req, res) => {
    const supabase = req.supabase;
    const id_usuario = req.user.id_usuario;

    try {
        const { producto_id, promocion_nombre, porcentaje_descuento, fecha_inicio, fecha_final, force_create = false } = req.body;

        // Validación de campos requeridos
        if (!producto_id || !promocion_nombre || !porcentaje_descuento || !fecha_inicio || !fecha_final) {
            return res.status(400).json({ error: 'Todos los campos son obligatorios' });
        }

        const id_empresa = await getEmpresaId(id_usuario, supabase);
        if (!id_empresa) {
            return res.status(404).json({ error: 'No se encontró la empresa asociada al usuario' });
        }

        // Verificar que el producto pertenece a la empresa
        const { data: productoExiste } = await supabase
            .from('producto')
            .select('id_producto')
            .eq('id_producto', producto_id)
            .eq('id_empresa', id_empresa)
            .single();

        if (!productoExiste) {
            return res.status(400).json({ error: 'El producto no pertenece a esta empresa o no existe' });
        }

        // Verificar si hay promociones activas que se solapen
        const { data: promocionesExistentes, error: errorBusqueda } = await supabase
            .from(TABLA_PROMOCIONES)
            .select('*')
            .eq('producto_Id', producto_id)
            .eq('manejo_automatico', true);

        if (errorBusqueda) throw errorBusqueda;

        // Verificar solapamiento de fechas
        const nuevaFechaInicio = new Date(fecha_inicio);
        const nuevaFechaFinal = new Date(fecha_final);
        
        const promocionSolapada = promocionesExistentes?.find(promo => {
            const promoInicio = new Date(promo.fecha_inicio);
            const promoFinal = new Date(promo.fecha_final);
            
            return (
                (nuevaFechaInicio >= promoInicio && nuevaFechaInicio <= promoFinal) ||
                (nuevaFechaFinal >= promoInicio && nuevaFechaFinal <= promoFinal) ||
                (nuevaFechaInicio <= promoInicio && nuevaFechaFinal >= promoFinal)
            );
        });

        // Si hay solapamiento y no se fuerza la creación, retornar error
        if (promocionSolapada && !force_create) {
            return res.status(409).json({
                error: 'Hay una promoción activa que coincide con las fechas indicadas',
                promocion_existente: promocionSolapada
            });
        }

        // Si se fuerza la creación, desactivar la promoción existente
        if (promocionSolapada && force_create) {
            const { error: errorUpdate } = await supabase
                .from(TABLA_PROMOCIONES)
                .update({ estado: false,
                    manejo_automatico: false
                 })
                .eq('id', promocionSolapada.id);

            if (errorUpdate) throw errorUpdate;
        }

        // Crear la nueva promoción
        const { data: promocion, error } = await supabase
            .from(TABLA_PROMOCIONES)
            .insert({
                producto_Id: producto_id,
                promocion_nombre,
                porcentaje_descuento,
                fecha_inicio,
                fecha_final,
                estado: false,
                manejo_automatico: true
            })
            .select('*');

        if (error) throw error;

        // Obtener información del producto para la respuesta
        const { data: producto } = await supabase
            .from('producto')
            .select('*')
            .eq('id_producto', producto_id)
            .single();

        const promocionConProducto = {
            ...promocion[0],
            producto
        };

        res.status(200).json([promocionConProducto]);
    } catch (error) {
        console.error('Error completo:', error);
        res.status(500).json({ error: 'Error al crear promoción', details: error.message });
    }
};

const patchPromocion = async (req, res) => {
    const supabase = req.supabase;
    const id_usuario = req.user.id_usuario;

    try {
        const { id } = req.params;
        const { promocion_nombre, porcentaje_descuento, fecha_inicio, fecha_final } = req.body;

        if (!id) {
            return res.status(400).json({ error: 'ID de promoción no proporcionado' });
        }

        const id_empresa = await getEmpresaId(id_usuario, supabase);
        if (!id_empresa) {
            return res.status(404).json({ error: 'No se encontró la empresa asociada al usuario' });
        }

        // Verificar que la promoción existe
        const { data: promocionExistente, error: errorBusqueda } = await supabase
            .from(TABLA_PROMOCIONES)
            .select('*, producto:producto_Id(id_empresa)')
            .eq('id', id)
            .single();

        if (errorBusqueda || !promocionExistente) {
            return res.status(404).json({ error: 'Promoción no encontrada' });
        }

        // Verificar que el producto pertenece a la empresa del usuario
        const { data: producto } = await supabase
            .from('producto')
            .select('id_producto')
            .eq('id_producto', promocionExistente.producto_Id)
            .eq('id_empresa', id_empresa)
            .single();

        if (!producto) {
            return res.status(403).json({ error: 'No tiene permisos para modificar esta promoción' });
        }

        // Actualizar la promoción
        const { data: promocion, error: errorUpdate } = await supabase
            .from(TABLA_PROMOCIONES)
            .update({
                promocion_nombre,
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
        res.status(500).json({ error: 'Error al actualizar promoción', details: error.message });
    }
};

const cambiarEstadoPromocion = async (req, res) => {
    const supabase = req.supabase;
    const id_usuario = req.user.id_usuario;

    try {
        const { id } = req.params;
        const { manejo_automatico } = req.body;

        if (!id) {
            return res.status(400).json({ error: 'ID de promoción no proporcionado' });
        }
        

        const id_empresa = await getEmpresaId(id_usuario, supabase);
        if (!id_empresa) {
            return res.status(404).json({ error: 'No se encontró la empresa asociada al usuario' });
        }

        // Verificar que la promoción existe
        const { data: promocionExistente, error: errorBusqueda } = await supabase
            .from(TABLA_PROMOCIONES)
            .select('*')
            .eq('id', id)
            .single();

        if (errorBusqueda || !promocionExistente) {
            return res.status(404).json({ error: 'Promoción no encontrada' });
        }

        // Verificar que el producto pertenece a la empresa
        const { data: producto } = await supabase
            .from('producto')
            .select('id_producto')
            .eq('id_producto', promocionExistente.producto_Id)
            .eq('id_empresa', id_empresa)
            .single();

        if (!producto) {
            return res.status(403).json({ error: 'No tiene permisos para modificar esta promoción' });
        }

        // Actualizar el estado
        const { data: promocionActualizada, error } = await supabase
            .from(TABLA_PROMOCIONES)
            .update({ manejo_automatico: manejo_automatico,
                estado: false
             })
            .eq('id', id)
            .select('*');
            if (manejo_automatico === false) {
                await eliminarPromoAlert(id, supabase);
            }

        if (error) throw error;

        res.status(200).json(promocionActualizada[0]);
    } catch (error) {
        console.error('Error completo:', error);
        res.status(500).json({ error: 'Error al cambiar estado de la promoción', details: error.message });
    }
};

const eliminarPromocion = async (req, res) => {
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

        // Verificar que la promoción existe y pertenece a un producto de la empresa
        const { data: promocionExistente } = await supabase
            .from(TABLA_PROMOCIONES)
            .select('*, producto:producto_Id(id_producto, id_empresa)')
            .eq('id', id)
            .single();

        if (!promocionExistente) {
            return res.status(404).json({ error: 'Promoción no encontrada' });
        }

        // Verificar que el producto pertenece a la empresa
        const { data: producto } = await supabase
            .from('producto')
            .select('id_producto')
            .eq('id_producto', promocionExistente.producto_Id)
            .eq('id_empresa', id_empresa)
            .single();

        if (!producto) {
            return res.status(403).json({ error: 'No tiene permisos para eliminar esta promoción' });
        }

        // Eliminar la promoción
        const { error } = await supabase
            .from(TABLA_PROMOCIONES)
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.status(200).json(true);
    } catch (error) {
        console.error('Error completo:', error);
        res.status(500).json({ error: 'Error al eliminar promoción', details: error.message });
    }
};

const getProductosEmpresa = async (req, res) => {
    const supabase = req.supabase;
    const id_usuario = req.user.id_usuario;

    try {
        const id_empresa = await getEmpresaId(id_usuario, supabase);
        if (!id_empresa) {
            return res.status(404).json({ error: 'No se encontró la empresa asociada al usuario' });
        }

        const { data: productos, error } = await supabase
            .from('producto')
            .select('id_producto, nombre')
            .eq('id_empresa', id_empresa)
            .eq('estado', true);

        if (error) throw error;

        res.status(200).json(productos);
    } catch (error) {
        console.error('Error completo:', error);
        res.status(500).json({ error: 'Error al obtener productos', details: error.message });
    }
};

module.exports = {
    getPromocionesEmpresa,
    postPromocion,
    patchPromocion,
    cambiarEstadoPromocion,
    eliminarPromocion,
    getProductosEmpresa
};