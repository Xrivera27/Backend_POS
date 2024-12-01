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

    const { data: usuario, error } = await supabase.from('Usuarios').insert(
      {
        nombre: nombre,
        apellido: apellido,
        nombre_usuario: nombre_usuario,
        contraseña: contraseña,
        correo: correo,
        telefono: telefono,
        direccion: direccion,
        id_rol: id_rol,
        estado: true
      }).select('*');

    if (error) {
      console.log(error);
      return res.status(500).json({ error: error.message });
    }

    const nuevaRelacion = await insertarRelacion(usuario[0].id_usuario, id_sucursal, supabase);

    if (nuevaRelacion != true) {
 
      const borrarUsuario = await deleteUsuario(usuario[0].id_usuario, supabase);
      if(borrarUsuario) console.log('Se borro el usuario creado');

      throw new Error('Fallo del servidor');
    }

    usuario[0].sucursales = await getSucursalesbyUser(usuario[0].id_usuario, supabase);

    return res.status(200).json(usuario);

  } catch (error) {
    console.log('ha habido un error en la api');
    res.status(500).json({ error: error.message });
  }
}

const patchUsuario = async (req, res) => {
  const supabase = req.supabase;
  const { nombre, apellido, nombre_usuario, contraseña, correo, telefono, direccion, id_rol, id_sucursal } = req.body;
  const id_usuario = req.params.id_usuario;

  try {
      const { data, error } = await supabase.from('Usuarios').update(
           {
        nombre: nombre,
        apellido: apellido,
        nombre_usuario: nombre_usuario,
        contraseña: contraseña,
        correo: correo,
        telefono: telefono,
        direccion: direccion,
        id_rol: id_rol,
      }).eq('id_usuario', id_usuario);

      const { dataSucursal, errorSucursal } = await supabase.from('sucursales_usuarios').update({
        id_sucursal: id_sucursal
      }).eq('id_usuario', id_usuario);

      if(error || errorSucursal) {
       return res.status(500).json({error: error.message});
      }

      res.status(200).json({ data, dataSucursal });

  } catch (error) {
      console.log('ha habido un error en la api');
      res.status(500).json({error: error.message});
  }
}

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

module.exports = {
  getUsuario, getRolUsuario, getUsuarioOfSucursal, getUsuarioOfEmpresa, postUsuario, patchUsuario, desactivarUsuario
};
