const { conteoProdinCat } = require('./catProdSvs.js');

const tienePromoProducto = async (id_producto, supabase) => {
try {
    const {data: promocionProducto, error} = await supabase
    .from('Producto_promocion')
    .select('id, promocion_nombre, porcentaje_descuento')
    .eq('producto_Id', id_producto)
    .eq('estado', true);

    if(error){
        throw error;
    }

    if(promocionProducto.length === 0){
        return {
            resultado: true,
            message: 'No hay promociones para este producto.',
            promocionProducto
          }
      }

    return {
        resultado: true,
        message: 'Se obtuvo una promocion para este producto',
        promocionProducto
    }

} catch (error) {
    return{
        resultado: false,
        message: 'No se obtuvo una promocion para este producto',
        error: error
    }
}
}

const tienePromoCategoria = async (id_producto, supabase) => {
    try {
        const { data: promocionCategoria, error } = await supabase
      .from('asignacion_producto_categoria')
      .select(`
        categoria_producto(
          id_categoria,
          nombre_categoria,
          categoria_promocion(
            categoria_producto_Id,
            nombre_promocion,
            porcentaje_descuento
          )
        )
      `)
      .eq('id_producto', id_producto)
      .eq('categoria_producto.categoria_promocion.estado', true);

      const conteos = promocionCategoria.map(async(categoria) => {
           const conteo = await conteoProdinCat(categoria.categoria_producto.id_categoria, supabase)
           categoria.categoria_producto.productosUsando = conteo;
           return conteo;
        });
      
      await Promise.all(conteos);

      if(error){
        throw error;
      }

      if(promocionCategoria.length === 0){
        return {
            resultado: true,
            message: 'No hay promociones de categorias para este producto.',
            promocionCategoria
          }
      }

      return {
        resultado: true,
        message: 'Se encontraron promociones de categorias para este producto',
        promocionCategoria
      }

    } catch (error) {
        return {
            resultado: false,
            message: error
        }
    }
}

const obtenerPromos = async(id_producto, supabase) => {
    try {
        const promesasPromociones = [
            tienePromoProducto(id_producto, supabase),
            tienePromoCategoria(id_producto, supabase)
        ];

        const resultados = await Promise.all(promesasPromociones);
        const promociones = resultados[0];
        const promocionesCategoria = resultados[1];

        
        if(!promociones.resultado){
            throw promociones.error;
        }
        
        if(!promocionesCategoria.resultado){
            throw promocionesCategoria.message;
        }

        return {
            promociones, promocionesCategoria
        }

    } catch (error) {
        return {
            error: error
        }
    }
}

module.exports = { tienePromoProducto, tienePromoCategoria, obtenerPromos }