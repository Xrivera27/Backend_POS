// controllers/CategoriaEmpresaControllerPerdomo.js
const { supabaseClient: supabase } = require('../supabaseClient');

exports.getCategorias = async (req, res) => {
  console.log('Iniciando getCategorias...');
  try {
    console.log('Ejecutando consulta a Supabase...');
    const { data, error } = await supabase
      .from('categoria_empresa')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error en getCategorias:', error);
      return res.status(400).json({ error: error.message });
    }
    
    console.log('Categorías recuperadas exitosamente:', data);
    res.status(200).json(data);
  } catch (err) {
    console.error('Error inesperado en getCategorias:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.getCategoriaById = async (req, res) => {
  console.log('Iniciando getCategoriaById...');
  try {
    const { id } = req.params;
    console.log('Buscando categoría con ID:', id);
    
    const { data, error } = await supabase
      .from('categoria_empresa')
      .select('*')
      .eq('id_categoria', id)
      .single();
    
    if (error) {
      console.error('Error en getCategoriaById:', error);
      return res.status(400).json({ error: error.message });
    }
    
    console.log('Categoría recuperada:', data);
    res.status(200).json(data);
  } catch (err) {
    console.error('Error inesperado en getCategoriaById:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.createCategoria = async (req, res) => {
  console.log('Iniciando createCategoria...');
  try {
    const { categoria, descripcion } = req.body;
    console.log('Datos recibidos:', { categoria, descripcion });

    // Validar que los campos requeridos estén presentes
    if (!categoria || !descripcion) {
      return res.status(400).json({ 
        error: 'Los campos categoria y descripcion son requeridos' 
      });
    }
    
    // Verificar si ya existe una categoría con el mismo nombre
    const { data: existingCategoria, error: errorConsulta } = await supabase
      .from('categoria_empresa')
      .select('id_categoria')
      .eq('categoria', categoria)
      .single();

    if (existingCategoria) {
      return res.status(400).json({ 
        error: 'Ya existe una categoría con ese nombre' 
      });
    }
    
    const { data, error } = await supabase
      .from('categoria_empresa')
      .insert([{ 
        categoria, 
        descripcion,
        created_at: new Date().toISOString()
      }])
      .select();
    
    if (error) {
      console.error('Error en createCategoria:', error);
      return res.status(400).json({ error: error.message });
    }
    
    console.log('Categoría creada exitosamente:', data);
    res.status(201).json(data[0]);
  } catch (err) {
    console.error('Error inesperado en createCategoria:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateCategoria = async (req, res) => {
  console.log('Iniciando updateCategoria...');
  try {
    const { id } = req.params;
    const { categoria, descripcion } = req.body;
    console.log('Actualizando categoría:', { id, categoria, descripcion });

    // Validar que los campos requeridos estén presentes
    if (!categoria || !descripcion) {
      return res.status(400).json({ 
        error: 'Los campos categoria y descripcion son requeridos' 
      });
    }

    // Verificar si existe la categoría que se quiere actualizar
    const { data: categoriaExistente, error: errorConsulta } = await supabase
      .from('categoria_empresa')
      .select('id_categoria')
      .eq('id_categoria', id)
      .single();

    if (!categoriaExistente) {
      return res.status(404).json({ 
        error: 'No se encontró la categoría a actualizar' 
      });
    }

    // Verificar si el nuevo nombre de categoría ya existe (excluyendo la categoría actual)
    const { data: nombreExistente, error: errorNombre } = await supabase
      .from('categoria_empresa')
      .select('id_categoria')
      .eq('categoria', categoria)
      .neq('id_categoria', id)
      .single();

    if (nombreExistente) {
      return res.status(400).json({ 
        error: 'Ya existe otra categoría con ese nombre' 
      });
    }
    
    const { data, error } = await supabase
      .from('categoria_empresa')
      .update({ 
        categoria, 
        descripcion 
      })
      .eq('id_categoria', id)
      .select();
    
    if (error) {
      console.error('Error en updateCategoria:', error);
      return res.status(400).json({ error: error.message });
    }
    
    console.log('Categoría actualizada exitosamente:', data);
    res.status(200).json(data[0]);
  } catch (err) {
    console.error('Error inesperado en updateCategoria:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.deleteCategoria = async (req, res) => {
    console.log('Iniciando deleteCategoria...');
    try {
      const { id } = req.params;
      console.log('Verificando uso de categoría con ID:', id);
      
      // Verificamos si la categoría existe
      const { data: categoriaExistente, error: errorCategoria } = await supabase
        .from('categoria_empresa')
        .select('id_categoria')
        .eq('id_categoria', id)
        .single();
  
      if (!categoriaExistente) {
        return res.status(404).json({ 
          error: 'No se encontró la categoría a eliminar' 
        });
      }
  
      // Verificamos si hay CUALQUIER empresa usando esta categoría
      const { data: empresasVinculadas, error: errorConsulta } = await supabase
        .from('Empresas')
        .select('id_empresa, estado')
        .eq('id_categoria', id);
      
      if (errorConsulta) {
        console.error('Error al verificar empresas vinculadas:', errorConsulta);
        return res.status(400).json({ error: errorConsulta.message });
      }
  
      if (empresasVinculadas && empresasVinculadas.length > 0) {
        // Verificamos si hay empresas activas
        const empresasActivas = empresasVinculadas.filter(empresa => empresa.estado);
        
        if (empresasActivas.length > 0) {
          return res.status(400).json({ 
            error: 'No se puede eliminar la categoría porque está siendo utilizada por empresas activas'
          });
        } else {
          return res.status(400).json({ 
            error: 'No se puede eliminar la categoría porque está vinculada a empresas inactivas. Debe eliminar primero estas referencias'
          });
        }
      }
  
      // Si no hay empresas vinculadas, procedemos con la eliminación
      const { data, error } = await supabase
        .from('categoria_empresa')
        .delete()
        .eq('id_categoria', id);
      
      if (error) {
        // Si es un error de clave foránea, damos un mensaje más amigable
        if (error.code === '23503') {
          return res.status(400).json({ 
            error: 'No se puede eliminar la categoría porque está siendo utilizada por una o más empresas'
          });
        }
        
        console.error('Error en deleteCategoria:', error);
        return res.status(400).json({ error: error.message });
      }
      
      console.log('Categoría eliminada exitosamente');
      res.status(200).json({ message: 'Categoría eliminada exitosamente' });
    } catch (err) {
      console.error('Error inesperado en deleteCategoria:', err);
      res.status(500).json({ error: err.message });
    }
  };

module.exports = exports;