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
            resultado: false,
            message: 'No hay promociones para este producto.',
            promos: []
          }
      }

    return {
        resultado: true,
        message: 'Se obtuvo una promocion para este producto',
        promos: promocionProducto
    }

} catch (error) {
    return{
        resultado: false,
        message: 'Ocurrio un error al buscar una promocion para este producto',
        error: error
    }
}
}

const tienePromoCategoria = async (id_producto, supabase) => {
    try {
        const { data: categoria, error } = await supabase
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

      const promocionCategoria = categoria.filter(categoriaPromo => categoriaPromo.categoria_producto.categoria_promocion.length > 0 );

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
            resultado: false,
            message: 'No hay promociones de categorias para este producto.',
            promos: []
          }
      }

      return {
        resultado: true,
        message: 'Se encontraron promociones de categorias para este producto',
        promos: promocionCategoria
      }

    } catch (error) {
        return {
            resultado: false,
            message: 'Ocurrio un error al buscar promociones de categoria.',
            message: error
        }
    }
}

const tienePromoCategoriabyCategoria = async (id_categoria, supabase) => {
    try {
        const {data: promocionCategoria, error} = await supabase
        .from('categoria_promocion')
        .select('id, nombre_promocion, porcentaje_descuento')
        .eq('categoria_Id', id_categoria)
        .eq('estado', true);
    
        if(error){
            throw error;
        }
    
        if(promocionCategoria.length === 0){
            return {
                resultado: false,
                message: 'No hay promociones para esta Categoria.',
                promos: []
              }
          }
    
        return {
            resultado: true,
            message: 'Se obtuvo una promocion para esta Categoria',
            promos: promocionCategoria
        }
    
    } catch (error) {
        return{
            resultado: false,
            message: 'No se obtuvo una promocion para este producto',
            error: error
        }
    }
}

const definirPrioridad = (promocionProducto, promocionCategoria) => {

        if(promocionProducto.length !== 0){
            return promocionProducto[0];
        }
        else{
           return definirPrioridadCategoria(promocionCategoria);
        }

}

const definirPrioridadCategoria = (promocionCategoria) => {

    const menorValor = Math.min(...promocionCategoria.map(elemento => elemento.categoria_producto.productosUsando));
    const arrayCantidadUsando = promocionCategoria.filter(elemento => elemento.categoria_producto.productosUsando === menorValor);

    if(arrayCantidadUsando.length > 1){
        const objetoConMenorConteo = arrayCantidadUsando.reduce((minObj, currentObj) => {
            return (currentObj.categoria_producto.categoria_promocion[0].porcentaje_descuento > minObj.categoria_producto.categoria_promocion[0].porcentaje_descuento) ? currentObj : minObj;
          }, arrayCantidadUsando[0]);
          return {
            id: objetoConMenorConteo.categoria_producto.id_categoria,
            nombre_promocion: objetoConMenorConteo.categoria_producto.nombre_categoria,
            porcentaje_descuento: objetoConMenorConteo.categoria_producto.categoria_promocion[0].porcentaje_descuento
          }
    }
   
   return {
    id: arrayCantidadUsando[0].categoria_producto.categoria_promocion[0].categoria_producto_Id,
    nombre: arrayCantidadUsando[0].categoria_producto.categoria_promocion[0].nombre_promocion,
    porcentaje_descuento: arrayCantidadUsando[0].categoria_producto.categoria_promocion[0].porcentaje_descuento
   }

}

const obtenerPromos = async(id_producto, supabase) => {
    try {
        const promesasPromociones = [
            tienePromoProducto(id_producto, supabase),
            tienePromoCategoria(id_producto, supabase)
        ];

        const resultados = await Promise.all(promesasPromociones);
        const { promos: promosProduct, message: messProduct, error: errorProduct } = resultados[0];
        const { promos: promosCategory, message: messCategory, error: errorCategory } = resultados[1];

        if(errorProduct){
            console.error(messProduct, errorProduct);
            throw messProduct;
        }
        
        if(errorCategory){
            console.error(messCategory, errorCategory);
            throw messCategory;
        }

        if(promosProduct.length === 0 && promosCategory.length === 0){
            return {
                resultado: false,
                promocionActiva: [],
            }
        }

        const promocionUsar = definirPrioridad(promosProduct, promosCategory);    

        return {resultado: true, promocionActiva: promocionUsar,                 
            promociones: promosProduct,
            promocionesCategoria: promosCategory};
            
        

    } catch (error) {
        console.log(error);
        return {
            resultado: false,
            error: 'Error al buscar una promocion para este producto'
        }
    }
}

module.exports = { tienePromoProducto, tienePromoCategoria, tienePromoCategoriabyCategoria, obtenerPromos }