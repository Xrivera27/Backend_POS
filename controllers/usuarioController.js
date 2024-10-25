const { response } = require('express');
const { insertarRelacion, getSucursalesbyUser } = require('../db/sucursalUsuarioSvc.js');
const { getEmpresaId } = require('../db/empresaSvc.js');


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

      // Verificamos si se encontró el usuario

      const filtroUsers = usuarios.filter( usuario => usuario.id_rol != 4 ).filter( usuario => usuario.estado == true );

      for (const usuario of filtroUsers){
        usuario.sucursales= await getSucursalesbyUser(usuario.id_usuario, supabase);
      }

      res.status(200).json(filtroUsers);

    } catch (error) {
      res.status(500).json({ error: error.message });
    }

  } catch (error) {

    res.status(500).json(error);
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
  getUsuario, getUsuarioOfEmpresa, postUsuario, patchUsuario, desactivarUsuario
};
