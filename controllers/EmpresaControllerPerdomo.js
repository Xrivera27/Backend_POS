// controllers/EmpresaControllerPerdomo.js
const { supabaseClient: supabase } = require('../supabaseClient');

// Obtener todas las empresas activas
exports.getEmpresas = async (req, res) => {
    console.log('Iniciando getEmpresas...');
    try {
      console.log('Ejecutando consulta a Supabase...');
      const { data, error } = await supabase
        .from('Empresas')
        .select(`
          id_empresa,
          nombre,
          rtn,
          correo_principal,
          telefono_principal,
          created_at,
          categoria_empresa (
            id_categoria,
            categoria,
            descripcion
          )
        `)
        .eq('estado', true)
        .order('created_at', { ascending: false }); // Ordenar por fecha de creación descendente
      
      console.log('Respuesta de Supabase:', { data, error });
      
      if (error) {
        console.error('Error en getEmpresas:', error);
        return res.status(400).json({ error: error.message });
      }
      
      console.log('Datos recuperados exitosamente:', data);
      res.status(200).json(data);
    } catch (err) {
      console.error('Error inesperado en getEmpresas:', err);
      res.status(500).json({ error: err.message });
    }
  };

// Obtener empresa activa por ID
exports.getEmpresaById = async (req, res) => {
  console.log('Iniciando getEmpresaById...');
  console.log('ID recibido:', req.params.id);
  
  try {
    const { id } = req.params;
    console.log('Ejecutando consulta a Supabase para ID:', id);
    
    const { data, error } = await supabase
      .from('Empresas')
      .select(`
        id_empresa,
        nombre,
        rtn,
        correo_principal,
        telefono_principal,
        categoria_empresa (
          id_categoria,
          categoria,
          descripcion
        )
      `)
      .eq('id_empresa', id)
      .eq('estado', true)
      .single();
    
    console.log('Respuesta de Supabase:', { data, error });
    
    if (error) {
      console.error('Error en getEmpresaById:', error);
      return res.status(400).json({ error: error.message });
    }
    
    console.log('Datos de empresa recuperados:', data);
    res.status(200).json(data);
  } catch (err) {
    console.error('Error inesperado en getEmpresaById:', err);
    res.status(500).json({ error: err.message });
  }
};

// Obtener empresas activas por categoría
exports.getEmpresasByCategoria = async (req, res) => {
  console.log('Iniciando getEmpresasByCategoria...');
  console.log('ID de categoría recibido:', req.params.categoriaId);
  
  try {
    const { categoriaId } = req.params;
    console.log('Ejecutando consulta a Supabase para categoría:', categoriaId);
    
    const { data, error } = await supabase
      .from('Empresas')
      .select(`
        id_empresa,
        nombre,
        rtn,
        correo_principal,
        telefono_principal,
        categoria_empresa (
          id_categoria,
          categoria,
          descripcion
        )
      `)
      .eq('id_categoria', categoriaId)
      .eq('estado', true);
    
    console.log('Respuesta de Supabase:', { data, error });
    
    if (error) {
      console.error('Error en getEmpresasByCategoria:', error);
      return res.status(400).json({ error: error.message });
    }
    
    console.log('Datos recuperados exitosamente:', data);
    res.status(200).json(data);
  } catch (err) {
    console.error('Error inesperado en getEmpresasByCategoria:', err);
    res.status(500).json({ error: err.message });
  }
};

// Actualizar empresa
exports.updateEmpresa = async (req, res) => {
  console.log('Iniciando updateEmpresa...');
  console.log('ID recibido:', req.params.id);
  console.log('Datos recibidos:', req.body);
  
  try {
    const { id } = req.params;
    const actualizaciones = req.body;
    
    console.log('Ejecutando actualización en Supabase para ID:', id);
    
    const { data, error } = await supabase
      .from('Empresas')
      .update(actualizaciones)
      .eq('id_empresa', id)
      .select();
    
    if (error) {
      console.error('Error en updateEmpresa:', error);
      return res.status(400).json({ error: error.message });
    }
    
    console.log('Empresa actualizada exitosamente:', data);
    res.status(200).json(data[0]);
  } catch (err) {
    console.error('Error inesperado en updateEmpresa:', err);
    res.status(500).json({ error: err.message });
  }
};

// Desactivar empresa (soft delete)
exports.deleteEmpresa = async (req, res) => {
  console.log('Iniciando deleteEmpresa...');
  console.log('ID recibido:', req.params.id);
  
  try {
    const { id } = req.params;
    console.log('Ejecutando desactivación en Supabase para ID:', id);
    
    const { data, error } = await supabase
      .from('Empresas')
      .update({ estado: false })
      .eq('id_empresa', id)
      .select();
    
    if (error) {
      console.error('Error en deleteEmpresa:', error);
      return res.status(400).json({ error: error.message });
    }
    
    console.log('Empresa desactivada exitosamente:', data);
    res.status(200).json({ message: 'Empresa desactivada exitosamente' });
  } catch (err) {
    console.error('Error inesperado en deleteEmpresa:', err);
    res.status(500).json({ error: err.message });
  }
};