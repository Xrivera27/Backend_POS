const supabase = require('../supabaseClient');

// Obtener todas las sucursales
exports.getSucursales = async (req, res) => {
  const { data, error } = await supabase.from('Sucursales').select('*');
  
  if (error) return res.status(400).json({ error: error.message });
  
  res.status(200).json(data);
};

// Crear una nueva sucursal
exports.createSucursal = async (req, res) => {
  const { nombre, ciudad, telefono, direccion, correo } = req.body;
  
  const { data, error } = await supabase.from('Sucursales').insert([{ nombre_administrativo: nombre, ciudad, telefono, direccion, correo }]);
  
  if (error) return res.status(400).json({ error: error.message });
  
  res.status(201).json(data);
};

// Editar una sucursal existente
exports.updateSucursal = async (req, res) => {
  const { id } = req.params;
  const { nombre, ciudad, telefono, direccion, correo } = req.body;
  
  const { data, error } = await supabase.from('Sucursales').update({ nombre_administrativo: nombre, ciudad, telefono, direccion, correo }).eq('id_sucursal', id);
  
  if (error) return res.status(400).json({ error: error.message });
  
  res.status(200).json(data);
};

// Eliminar una sucursal
exports.deleteSucursal = async (req, res) => {
  const { id } = req.params;
  
  const { data, error } = await supabase.from('Sucursales').delete().eq('id_sucursal', id);
  
  if (error) return res.status(400).json({ error: error.message });
  
  res.status(200).json(data);
};