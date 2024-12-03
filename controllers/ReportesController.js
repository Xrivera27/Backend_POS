const { existeRelacion, getIdUsersBySucursal, getSucursalesbyUser, getIdCajeroBySucursal } = require('../db/sucursalUsuarioSvc.js');
const { getRolByUsuario } = require('../db/validaciones.js');
const { getEmpresaId } = require('../db/empresaSvc.js')

const reporteVentasController = {
  async getReporteVentas(req, res) {
    try {
      console.log('1. Iniciando getReporteVentas');
      const {
        tipo_reporte,
        fecha_inicio,
        fecha_fin,
        id_cliente,
        id_sucursal,
        id_empleado
      } = req.query;
      
      console.log('2. Parámetros recibidos:', { 
        tipo_reporte, 
        fecha_inicio, 
        fecha_fin, 
        id_cliente, 
        id_sucursal, 
        id_empleado 
      });

      console.log('3. Verificando usuario:', req.user);
      if (!req.user || !req.user.id_usuario) {
        console.log('Error: Usuario no autenticado');
        return res.status(401).json({ 
          error: 'Usuario no autenticado o ID de usuario no disponible' 
        });
      }

      console.log('4. ID de usuario:', req.user.id_usuario);
      const id_usuario = req.user.id_usuario;

      console.log('5. Obteniendo sucursal del usuario');
      const sucursalUsuario = await getSucursalesbyUser(id_usuario, req.supabase);
      console.log('6. Sucursal del usuario:', sucursalUsuario);

      console.log('7. Construyendo query base');
      let query = req.supabase
        .from('Ventas')
        .select(`
          id_venta,
          created_at,
          id_factura,
          facturas(
            id_factura,
            tipo_factura,
            total_extento,
            gravado_15,
            ISV_15,
            total,
            id_factura_SAR
          ),
          Sucursales!Ventas_id_sucursal_fkey(
            nombre_administrativo,
            estado
          ),
          Usuarios(
            nombre,
            apellido,
            estado
          ),
          Clientes(
            nombre_completo,
            estado
          )
        `);

      // Añadir filtros uno por uno para identificar cuál está causando el problema
      console.log('8. Aplicando filtros base');
      query = query.eq('estado', true);
      
      // Filtro de fechas
      console.log('9. Aplicando filtro de fechas');
      query = query
        .gte('created_at', fecha_inicio)
        .lte('created_at', fecha_fin);

      // Comprobar si hay datos antes de aplicar más filtros
      const { data: ventasPreFiltro, error: errorPreFiltro } = await query;
      console.log('Registros antes de filtros adicionales:', ventasPreFiltro?.length || 0);

      // Aplicar filtros adicionales
      if (sucursalUsuario) {
        console.log('10. Aplicando filtro de sucursal:', sucursalUsuario);
        query = query.eq('id_sucursal', sucursalUsuario);
      }

      if (id_empleado && !isNaN(id_empleado)) {
        console.log('11. Aplicando filtro de empleado:', id_empleado);
        query = query.eq('id_usuario', id_empleado);
      }

      console.log('12. Ejecutando consulta final');
      const { data: ventas, error } = await query;

      if (error) {
        console.error('Error en la consulta:', error);
        throw new Error(error.message);
      }

      console.log('13. Registros encontrados:', ventas?.length || 0);
      if (ventas?.length > 0) {
        console.log('Muestra del primer registro:', JSON.stringify(ventas[0], null, 2));
      }

      if (!ventas || ventas.length === 0) {
        console.log('14. No se encontraron datos');
        return res.json({
          datos: [],
          totales: { exento: 0, gravado: 0, isv: 0, total: 0 }
        });
      }

      console.log('15. Formateando datos');
      const datosFormateados = ventas.map(venta => ({
        fecha: venta.created_at,
        numero_factura_sar: venta.facturas?.id_factura_SAR,
        valor_exento: venta.facturas?.total_extento || 0,
        valor_gravado: venta.facturas?.gravado_15 || 0,
        isv: venta.facturas?.ISV_15 || 0,
        total: venta.facturas?.total || 0,
        ...(tipo_reporte === 'ventas_cliente' && { cliente: venta.Clientes?.nombre_completo }),
        ...(tipo_reporte === 'ventas_sucursal' && { sucursal: venta.Sucursales?.nombre_administrativo }),
        ...(tipo_reporte === 'ventas_empleado' && { 
          empleado: `${venta.Usuarios?.nombre} ${venta.Usuarios?.apellido}` 
        })
      }));

      console.log('16. Calculando totales');
      const totales = datosFormateados.reduce((acc, row) => ({
        exento: acc.exento + (parseFloat(row.valor_exento) || 0),
        gravado: acc.gravado + (parseFloat(row.valor_gravado) || 0),
        isv: acc.isv + (parseFloat(row.isv) || 0),
        total: acc.total + (parseFloat(row.total) || 0)
      }), { exento: 0, gravado: 0, isv: 0, total: 0 });

      console.log('17. Enviando respuesta');
      res.json({
        datos: datosFormateados,
        totales
      });

    } catch (error) {
      console.error('Error completo en reporte de ventas:', error);
      res.status(500).json({ 
        error: 'Error al generar el reporte de ventas',
        details: error.message 
      });
    }
  },
  

  async getClientes(req, res) {
    console.log('1. Iniciando getClientes');
    try {
      console.log('2. Verificando usuario:', req.user);
      if (!req.user || !req.user.id_usuario) {
        console.log('Error: Usuario no autenticado');
        return res.status(401).json({ 
          error: 'Usuario no autenticado' 
        });
      }

      console.log('3. Ejecutando consulta de clientes');
      const { data: clientes, error } = await req.supabase
        .from('Clientes')
        .select('id_cliente, nombre_completo')
        .eq('estado', true)
        .order('nombre_completo');

      if (error) {
        console.error('Error en consulta de clientes:', error);
        throw error;
      }

      console.log('4. Formateando datos de clientes');
      const clientesFormateados = clientes.map(cliente => ({
        id: cliente.id_cliente,
        nombre: cliente.nombre_completo
      }));

      console.log('5. Enviando respuesta con', clientesFormateados.length, 'clientes');
      res.json(clientesFormateados);
    } catch (error) {
      console.error('Error completo en getClientes:', error);
      res.status(500).json({ error: 'Error al obtener clientes' });
    }
  },

  async getSucursales(req, res) {
    console.log('1. Iniciando getSucursales');
    try {
      console.log('2. Verificando usuario:', req.user);
      if (!req.user || !req.user.id_usuario) {
        console.log('Error: Usuario no autenticado');
        return res.status(401).json({ 
          error: 'Usuario no autenticado' 
        });
      }

      console.log('3. Ejecutando consulta de sucursales');
      const { data: sucursales, error } = await req.supabase
        .from('Sucursales')
        .select('id_sucursal, nombre_administrativo')
        .eq('estado', true)
        .order('nombre_administrativo');

      if (error) {
        console.error('Error en consulta de sucursales:', error);
        throw error;
      }

      console.log('4. Formateando datos de sucursales');
      const sucursalesFormateadas = sucursales.map(sucursal => ({
        id: sucursal.id_sucursal,
        nombre: sucursal.nombre_administrativo
      }));

      console.log('5. Enviando respuesta con', sucursalesFormateadas.length, 'sucursales');
      res.json(sucursalesFormateadas);
    } catch (error) {
      console.error('Error completo en getSucursales:', error);
      res.status(500).json({ error: 'Error al obtener sucursales' });
    }
  },

  async getEmpleados(req, res) {
    console.log('1. Iniciando getEmpleados');
    try {
      console.log('2. Verificando usuario:', req.user);
      if (!req.user || !req.user.id_usuario) {
        console.log('Error: Usuario no autenticado');
        return res.status(401).json({ 
          error: 'Usuario no autenticado' 
        });
      }

      console.log('3. Ejecutando consulta de empleados');
      const { data: empleados, error } = await req.supabase
        .from('Usuarios')
        .select('id_usuario, nombre, apellido')
        .eq('estado', true)
        .eq('id_rol', 2)
        .order('nombre');

      if (error) {
        console.error('Error en consulta de empleados:', error);
        throw error;
      }

      console.log('4. Formateando datos de empleados');
      const empleadosFormateados = empleados.map(empleado => ({
        id: empleado.id_usuario,
        nombre: `${empleado.nombre} ${empleado.apellido}`
      }));

      console.log('5. Enviando respuesta con', empleadosFormateados.length, 'empleados');
      res.json(empleadosFormateados);
    } catch (error) {
      console.error('Error completo en getEmpleados:', error);
      res.status(500).json({ error: 'Error al obtener empleados' });
    }
  }
};

const getProductosOfInventorySucursal = async (req, res) => {
  const supabase = req.supabase;
  const id_usuario = req.params.id_usuario;
 

  try {
    const id_sucursal_param = await getSucursalesbyUser(id_usuario, supabase);
      const {data: productos, error} = await supabase.rpc('view_inventory_only_sucursal', {id_sucursal_param})
      .select('*');

      if (error){
          throw 'Ocurrio un error al obtener productos.'
      }

      res.status(200).json(productos);

  } catch (error) {
      console.log(error);
      res.status(500).json(error);
  }
}

const getUsuarioOfSucursal = async (req, res) => {
  try {
    const supabase = req.supabase;

    const id_usuario = req.params.id_usuario;
    const id_sucursal = await getSucursalesbyUser(id_usuario, supabase);

    const promesas = [
      existeRelacion(id_usuario, id_sucursal, supabase),
      getIdUsersBySucursal(id_sucursal, supabase)
    ];

    const promesasResultados = await Promise.all(promesas);

    const { resultado: resultRelacion } = promesasResultados[0];
    const { resultado: resultIds, ids } = promesasResultados[1];

    if(!resultRelacion){
      throw 'Este usuario no pertenece a la sucursal especificada';
    }

    if(!resultIds){
      throw 'Error al seleccionar usuarios de la sucursal';
    }

    const { data: usuarios, error } = await supabase.from('Usuarios')
    .select('id_usuario, id_rol, nombre, apellido, nombre_usuario, correo, telefono, direccion, estado')
    .eq('estado', true)
    .in('id_usuario', ids.map(i => i.id_usuario));

    const usuariosFiltro = usuarios.filter(u => u.id_rol === 3 && u.id_usuario !== Number(id_usuario) );

    if(usuariosFiltro && usuariosFiltro.length > 0){
      usuariosFiltro.forEach(element => {
      element.sucursales = id_sucursal;
      });
    }

    if(error){
      throw error;
    }

    res.status(200).json(usuariosFiltro);
    
  } catch (error) {
    console.error('Ocurrio un error: ', error);
    res.status(500).json({error: 'Fallo interno del servidor'});
  }
}

const getCajerosReportes = async (req, res) => {
  const id_usuario = req.params.id_usuario;
  const fechaInicio = req.params.fechaInicio;
  const fechaFin = req.params.fechaFin;
  const supabase = req.supabase;
  let idsUsar = [];
  let datosReporte = [];
  
  try {

const inicioTimestampZ = new Date(fechaInicio + 'T00:00:00+00:00').toISOString();
const finTimestampZ = new Date(fechaFin + 'T23:59:59+00:00').toISOString();

    const id_rol = await getRolByUsuario(id_usuario, supabase);

    if(id_rol === 4){
      const id_empresa_param = await getEmpresaId(id_usuario, supabase);
      const { data: usuarios, error: errorUsuario } = await supabase.rpc('get_usuariosbyidusuario', { id_empresa_param });
     
     if( !usuarios || usuarios.length === 0){
      return res.status(200).json({
        message: 'No hay cajeros'
      });
     }

     const usuarioFilter = usuarios.filter(u => u.estado === true && u.id_rol === 3  )

     if (errorUsuario){
      throw 'Error al recuperar IDs de usuarios al intentar recuperar reporte por empleados de ceo';
    }

    idsUsar = usuarioFilter;

    }
    else{
      const id_sucursal = await getSucursalesbyUser(id_usuario, supabase);

      const { ids: idsCajeros , resultado: resultadoCajeros } = await getIdCajeroBySucursal(id_sucursal, supabase);

      if (!resultadoCajeros){
        throw 'Error al recuperar IDs de usuarios al intentar recuperar reporte por empleados';
      }

      idsUsar = idsCajeros;
    }


    const promesas = 
    idsUsar.map(async (i) => {
        const {data: registro, error} = await supabase.rpc('obtener_reportes_por_usuario_fecha', 
          {p_id_usuario: i.id_usuario, p_fecha_inicio: inicioTimestampZ, p_fecha_fin: finTimestampZ})
        if(error){
          throw error;
        }
        registro[0].id = i.id_usuario;
        registro[0].nombre = `${i.nombre} ${i.apellido}`
        datosReporte.push(registro[0])
      });

      await Promise.all(promesas);
      console.log(datosReporte);

    res.status(200).json(datosReporte);

  } catch (error) {
    console.error('Ocurrio un error: ', error);
    res.status(500).json({
      message: 'Ocurrio un error en el servidor. Intente de nuevo'
    })
  }
  
}

const getClientesReportes = async (req, res) => {
  const id_usuario = req.params.id_usuario;
  const fechaInicio = req.params.fechaInicio;
  const fechaFin = req.params.fechaFin;
  const supabase = req.supabase;
  let idsUsar = [];
  let datosReporte = [];
  
  try {

const inicioTimestampZ = new Date(fechaInicio + 'T00:00:00+00:00').toISOString();
const finTimestampZ = new Date(fechaFin + 'T23:59:59+00:00').toISOString();

    const id_rol = await getRolByUsuario(id_usuario, supabase);

    if(id_rol === 4){

      const id_empresa_param = await getEmpresaId(id_usuario, supabase);
      const {data: registros, error} = await supabase.rpc('obtener_reportes_por_clientes_empresa', 
        {p_id_empresa: id_empresa_param, p_fecha_inicio: inicioTimestampZ, p_fecha_fin: finTimestampZ})
      if(error){
        throw error;
      }

      datosReporte = registros;

    }
    else{
      const id_sucursal = await getSucursalesbyUser(id_usuario, supabase);

 
      const {data: registros, error} = await supabase.rpc('obtener_reportes_por_clientes_sucursal', 
            {p_id_sucursal: id_sucursal, p_fecha_inicio: inicioTimestampZ, p_fecha_fin: finTimestampZ})
          if(error){
            throw error;
          }

          datosReporte = registros;

    }

    res.status(200).json(datosReporte);

  } catch (error) {
    console.error('Ocurrio un error: ', error);
    res.status(500).json({
      message: 'Ocurrio un error en el servidor. Intente de nuevo'
    })
  }
  
}

module.exports = {getCajerosReportes, getClientesReportes, reporteVentasController, getProductosOfInventorySucursal, getUsuarioOfSucursal};