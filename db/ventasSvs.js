const {  reducirInventario } = require('./inventarioSvc.js');

const calculos = {
    async calcularDetallesVenta(id_venta, productos, id_sucursal, supabase) {

        let exitos = 0;
        let subTotalVenta = 0;
        try{
            for (const elementoProducto of productos){
            const { totalDetalle, precio_usar } = await this.calcularDetalleProducto(elementoProducto, supabase);
            const { error } = await supabase.from('ventas_detalles')
            .insert({
                id_venta: id_venta,
                id_producto: elementoProducto.id_producto,
                cantidad: elementoProducto.cantidad,
                total_detalle: totalDetalle
            }).select('*');
    
            if(error){
                console.error('Error al obtener los datos de la tabla:', error.message);
                throw new Error('Ocurrió un error al insertar datos de la tabla detalles ventas.');
            }
    
            subTotalVenta += totalDetalle;
            elementoProducto.precio_usar = precio_usar;
    
            exitos++;
            
        }

        const factura = await this.calcularSubtotalVenta(id_venta, subTotalVenta, productos, supabase);
        return { exitos, factura }
        }
    
             catch (error) {
                console.error('Error en el proceso:', error);
                return 'Error al aplicar calcular detalles venta '+error;
            }
      },

      async calcularSubtotalVenta(id_venta, subTotalVenta, productos, supabase){
        try {
            const { error } = await supabase.from('Ventas')
            .update({
                sub_total: subTotalVenta
            })
            .eq('id_venta', id_venta);
    
            if (error){
                console.error('Error al obtener los datos de la tabla factura:', error.message);
                throw new Error('Ocurrió un error al obtener datos de la tabla producto.');
            }
    
           const factura =  await this.postFactura(id_venta, productos, supabase);
            return factura;
    
        } catch (error) {
            console.error('Error en el proceso:', error);
            return 'Error al aplicar subtotal venta '+error;
        }
      },

      async calcularDetalleProducto(elementoProducto, supabase){
        let precio_usar;
        try {
                
            const { data:  producto, error } = await supabase.from('producto')
            .select('precio_unitario, precio_mayorista, cantidad_activar_mayorista')
            .eq('id_producto',elementoProducto.id_producto)
            .single();
    
    
            if(error){
                console.error('Error al obtener los datos de la tabla:', error.message);
                throw new Error('Ocurrió un error al obtener datos de la tabla producto.');
            }
    
            if (
                producto.precio_mayorista > 0 && 
                producto.precio_mayorista !== null && 
                producto.precio_mayorista !== undefined &&
                producto.cantidad_activar_mayorista <= elementoProducto.cantidad
            )
                {
                    totalDetalle = producto.precio_mayorista * elementoProducto.cantidad;
                    precio_usar = producto.precio_mayorista;
            }
            else {
                totalDetalle = producto.precio_unitario * elementoProducto.cantidad;
                precio_usar = producto.precio_unitario;
            }

            return { totalDetalle, precio_usar }
    
        } catch (error) {
            console.error('Error en el proceso:', error);
            return 'Error al aplicar calcular detalles venta '+error;
        }
      },
    
      async postFactura(id_venta, productos, supabase){
        let arrayProductos = [];
        let subtotalTabla;
    
        for (const producto of productos){
            
            const { data: productosRegistros, error } = await supabase.from('producto')
            .select('id_producto, codigo_producto, impuesto')
            .eq('id_producto', producto.id_producto)
            .single();
    
            if(error){
                console.error('Error al obtener los datos de la tabla factura:', error.message);
                throw new Error('Ocurrió un error al obtener datos de la tabla producto.');
             }
             productosRegistros.precio_usar = producto.precio_usar;
             productosRegistros.cantidad = producto.cantidad;
             arrayProductos.push(productosRegistros);
    
        }
    
        const impuestos = this.calcularImpuestos(arrayProductos);
    
        try {
            const {data: venta, error } = await supabase.from('Ventas')
            .select('sub_total')
            .eq('id_venta', id_venta)
            .single();
    
            if(error){
                console.error('Error al obtener los datos de la tabla Venta:', error.message);
                throw new Error('Ocurrió un error al obtener datos de la venta.');
             }
    
              subtotalTabla = venta.sub_total;
            
        } catch (error) {
            console.error('Error en el proceso:', error);
            return 'Error al aplicar calcular detalles venta '+error;
        }
    
        try {

            const { data: factura, error } = await supabase.from('facturas')
            .insert({
                id_venta: id_venta,
                tipo_factura: "Pendiente",
                total_extento: impuestos.extento,
                gravado_15: impuestos.gravado_15,
                gravado_18: impuestos.gravado_18,
                ISV_15: impuestos.ISV_15,
                ISV_18: impuestos.ISV_18,
                total_ISV: impuestos.total_impuesto,
                total: subtotalTabla + impuestos.total_impuesto
            }).select('total_extento, gravado_15, gravado_18, total');
    
            if(error){
                console.error('Error al insertar factura:', error.message);
                throw new Error('Ocurrió un error al registrar factura.');
             }
    
    
             factura[0].sub_total = subtotalTabla;
             return factura[0];
    
        } catch (error) {
            console.error('Error en el proceso:', error);
            return 'Error '+error;
        }
      },

      impuestoProducto(precio_unitario, impuesto){
        let precio;
        switch(impuesto){
            case 1 || '1':
                precio = precio_unitario + (precio_unitario * 0.15);
            break;

            case 2 || '2':
                precio = precio_unitario + (precio_unitario * 0.15);
            break;

            case 3 || '3':
                precio = precio_unitario;
            break;

            default: console.log(`Impuesto: ${producto.impuesto} de producto ${producto.codigo_producto} no encontrado`);
        }

        return precio;
      },
    
      calcularImpuestos(productos){
        const objetoImpuestos = {
            extento: 0,
            gravado_15: 0,
            gravado_18: 0,
            ISV_15: 0,
            ISV_18: 0,
            total_impuesto: 0
        };
    
        for (const producto of productos){
            switch(producto.impuesto){
                case 1 || '1':
                    objetoImpuestos.gravado_15 += (producto.precio_usar * producto.cantidad);
                break;
    
                case 2 || '2':
                    objetoImpuestos.gravado_18 += (producto.precio_usar * producto.cantidad);
                break;
    
                case 3 || '3':
                    objetoImpuestos.extento += (producto.precio_usar * producto.cantidad );
                break;
    
                default: console.log(`Impuesto: ${producto.impuesto} de producto ${producto.codigo_producto} no encontrado`);
            }
        }
    
        objetoImpuestos.ISV_15 = objetoImpuestos.gravado_15 * 0.15;
        objetoImpuestos.ISV_18 = objetoImpuestos.gravado_18 * 0.18;
        objetoImpuestos.total_impuesto = objetoImpuestos.ISV_15 + objetoImpuestos.ISV_18;
    
        return objetoImpuestos;
    
      },
    
      async obtenerTotalFactura(id_venta, supabase){
        try {
            const { data: totalfactura, error } = await supabase.from('facturas')
            .select('total')
            .eq('id_venta', id_venta)
            .single();
    
            if(error){
                console.error('Error al obtener los datos de la tabla:', error.message);
                throw new Error('Ocurrió un error al obtener total de facturas.');
            }
    
            return totalfactura.total;
    
        } catch (error) {
            console.error('Error en el proceso:', error);
            return 'Error al recuperar total de venta '+error;
        }
      },
    
      async cambiarEstadoVenta(id_venta, supabase, estado){
        try {
            const { data: venta, error } = await supabase.from('Ventas')
            .update({
                estado: estado
            })
            .select('estado')
            .eq('id_venta', id_venta);
    
            if(error){
                console.error('Error al obtener los datos de la tabla:', error.message);
                throw new Error('Ocurrió un error al actualizar estado de ventas.');
            }
    
            return true;
    
        } catch (error) {
            console.error('Error en el proceso:', error);
            return 'Error al recuperar total de venta '+error;
        }
      }
}

module.exports = calculos;