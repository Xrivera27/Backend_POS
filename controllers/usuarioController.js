const { response } = require('express');
const { existeRelacion, getIdUsersBySucursal, insertarRelacion, getSucursalesbyUser } = require('../db/sucursalUsuarioSvc.js');
const { getEmpresaId } = require('../db/empresaSvc.js');
const { getRolByUsuario } = require('../db/validaciones.js');


const getUsuario = async (req, res) => {
  const supabase = req.supabase;

  try {
    const id_usuario = req.user.id_usuario;

    if (!id_usuario) {
      return res.status(400).json({ error: 'ID de usuario no proporcionado en el token' });
    }

    const { data: usuario, error } = await supabase
      .from('Usuarios')
      .select('*')
      .eq('id_usuario', id_usuario)
      .single(); // Cambia para obtener un único registro

    if (error) {
      return res.status(500).json({ error: 'Error al obtener el usuario: ' + error.message });
    }

    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.status(200).json(usuario); // Devuelve el usuario encontrado al frontend
  } catch (error) {
    res.status(500).json({ error: 'Error inesperado al obtener usuario' });
  }
};

const getRolUsuario = async (req, res) => {
  const supabase = req.supabase;
  try {

    const id_usuario = req.params.id_usuario;
    const id_rol = await getRolByUsuario(id_usuario, supabase);
    
    res.status(200).json(id_rol);

  } catch (error) {
    console.log(error);
    res.status(500).json({error: error});
  }
}

const getUsuarioOfEmpresa = async (req, res) => {
  const supabase = req.supabase;
  const id_usuario = req.params.id_usuario;
  try {
    const id_empresa_param = await getEmpresaId(id_usuario, supabase);

    try {
      const { data: usuarios, error } = await supabase.rpc('get_usuariosbyidusuario', { id_empresa_param });

      if (error) {
        throw new Error('Ocurrió un error en la consulta: ' + error.message);
      }

      const filtroUsers = usuarios
      .filter(usuario => usuario.id_usuario !=  id_usuario)
      .filter( usuario => usuario.id_rol != 4 )
      .filter( usuario => usuario.estado == true );

      const promesas = filtroUsers.map(async (u) => {
        u.sucursales = await getSucursalesbyUser(u.id_usuario, supabase);
      });

      await Promise.all(promesas),

      res.status(200).json(filtroUsers);

    } catch (error) {
      res.status(500).json({ error: error.message });
    }

  } catch (error) {

    res.status(500).json(error);
  }
}

const getUsuarioOfSucursal = async (req, res) => {
  try {
    const supabase = req.supabase;
    const id_sucursal = req.params.id_sucursal;
    const id_usuario = req.params.id_usuario;

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

    const usuariosFiltro = usuarios.filter(u => u.id_rol !== 4 && u.id_rol !== 2 && u.id_usuario !== Number(id_usuario) );

    if(usuariosFiltro && usuariosFiltro.length > 0){
      usuariosFiltro.forEach(element => {
      element.sucursales = id_sucursal;
      });
    }
    console.log()

    if(error){
      throw error;
    }

    res.status(200).json(usuariosFiltro);
    
  } catch (error) {
    console.error('Ocurrio un error: ', error);
    res.status(500).json({error: 'Fallo interno del servidor'});
  }
}

const postUsuario = async (req, res) => {
  const supabase = req.supabase;
  const { nombre, apellido, nombre_usuario, contraseña, correo, telefono, direccion, id_rol, id_sucursal } = req.body;

  try {
    const { data: usuario, error } = await supabase.from('Usuarios').insert({
      nombre,
      apellido,
      nombre_usuario,
      contraseña,
      correo,
      telefono,
      direccion,
      id_rol,
      estado: true
    }).select('*');

    if (error) {
      // Si el error es por violación de unique constraint
      if (error.code === '23505') {
        if (error.message.includes('nombre_usuario')) {
          return res.status(400).json({ error: 'El nombre de usuario ya está registrado' });
        }
        if (error.message.includes('correo')) {
          return res.status(400).json({ error: 'El correo electrónico ya está registrado' });
        }
      }
      return res.status(500).json({ error: error.message });
    }

    const nuevaRelacion = await insertarRelacion(usuario[0].id_usuario, id_sucursal, supabase);

    if (nuevaRelacion !== true) {
      const borrarUsuario = await deleteUsuario(usuario[0].id_usuario, supabase);
      if(borrarUsuario) console.log('Se borró el usuario creado');
      throw new Error('Fallo del servidor');
    }

    usuario[0].sucursales = await getSucursalesbyUser(usuario[0].id_usuario, supabase);
    return res.status(200).json(usuario);

  } catch (error) {
    console.log('Ha habido un error en la api');
    res.status(500).json({ error: error.message });
  }
};

const patchUsuario = async (req, res) => {
  const supabase = req.supabase;
  const { nombre, apellido, nombre_usuario, contraseña, correo, telefono, direccion, id_rol, id_sucursal } = req.body;
  const id_usuario = req.params.id_usuario;

  try {
    const { data, error } = await supabase.from('Usuarios').update({
      nombre,
      apellido,
      nombre_usuario,
      contraseña,
      correo,
      telefono,
      direccion,
      id_rol,
    }).eq('id_usuario', id_usuario);

    if (error) {
      // Si el error es por violación de unique constraint
      if (error.code === '23505') {
        if (error.message.includes('nombre_usuario')) {
          return res.status(400).json({ error: 'El nombre de usuario ya está registrado' });
        }
        if (error.message.includes('correo')) {
          return res.status(400).json({ error: 'El correo electrónico ya está registrado' });
        }
      }
      return res.status(500).json({ error: error.message });
    }

    const { dataSucursal, errorSucursal } = await supabase.from('sucursales_usuarios').update({
      id_sucursal: id_sucursal
    }).eq('id_usuario', id_usuario);

    if (errorSucursal) {
      return res.status(500).json({ error: errorSucursal.message });
    }

    res.status(200).json({ data, dataSucursal });

  } catch (error) {
    console.log('Ha habido un error en la api');
    res.status(500).json({ error: error.message });
  }
};


const deleteUsuario = async (id_usuario, supabase) => {
  try {
    const { data, error } = await supabase.from('Usuarios').delete().eq('id_usuario', id_usuario);

    if (error) {
      console.log(error);
      throw error;
    }
    return true;

  } catch (error) {
    throw new Error('Fallo del servidor: Relacion vacia');
  }

}

const desactivarUsuario = async (req, res) => {
  const supabase = req.supabase;
  const { estado } = req.body;
  const id_usuario = req.params.id_usuario;

  try {
      const { data, error } = await supabase.from('Usuarios').update(
          {
           estado: estado
      }).eq('id_usuario', id_usuario);

      if(error) {
       return res.status(500).json({error: error.message});
      }

      res.status(200).json(data);

  } catch (error) {
      console.log('ha habido un error en la api');
      res.status(500).json({error: error.message});
  }
}

const validarUsuario = async (req, res) => {
  const supabase = req.supabase;
  const { nombre_usuario, correo } = req.body;
  const id_usuario = req.params.id_usuario; // Solo presente en modo edición

  try {
    // Construir query base
    let query = supabase.from('Usuarios')
      .select('id_usuario, nombre_usuario, correo')
      .or(`nombre_usuario.eq.${nombre_usuario},correo.eq.${correo}`)
      .eq('estado', true); // Solo usuarios activos
    
    // En modo edición, excluimos el usuario actual
    if (id_usuario) {
      query = query.neq('id_usuario', id_usuario);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error('Error al validar usuario: ' + error.message);
    }

    const duplicados = [];
    
    if (data && data.length > 0) {
      // Verificar nombre de usuario duplicado
      if (data.some(u => u.nombre_usuario === nombre_usuario)) {
        duplicados.push('nombre_usuario');
      }

      // Verificar correo duplicado
      if (data.some(u => u.correo === correo)) {
        duplicados.push('correo');
      }
    }

    res.status(200).json({ 
      duplicados: duplicados.length > 0 ? duplicados : null 
    });

  } catch (error) {
    console.error('Error al validar usuario:', error);
    res.status(500).json({ error: 'Error al validar la información del usuario' });
  }
};

module.exports = {
  getUsuario, getRolUsuario, getUsuarioOfSucursal, getUsuarioOfEmpresa, postUsuario, patchUsuario, desactivarUsuario, validarUsuario
};
