// controllers/CategoriaEmpresaControllerPerdomo.js
const { supabaseClient: supabase } = require('../supabaseClient');

const CategoriaEmpresaControllerPerdomo = {
  // Obtener todas las categorías
  getCategorias: async (req, res) => {
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
  },

  // Obtener categoría por ID
  getCategoriaById: async (req, res) => {
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
      
      if (!data) {
        return res.status(404).json({ error: 'Categoría no encontrada' });
      }
      
      console.log('Categoría recuperada:', data);
      res.status(200).json(data);
    } catch (err) {
      console.error('Error inesperado en getCategoriaById:', err);
      res.status(500).json({ error: err.message });
    }
  },

  // Crear nueva categoría
  createCategoria: async (req, res) => {
    console.log('Iniciando createCategoria...');
    try {
      const { categoria, descripcion } = req.body;
      console.log('Datos recibidos:', { categoria, descripcion });

      // Validación de campos requeridos
      if (!categoria?.trim() || !descripcion?.trim()) {
        return res.status(400).json({ 
          error: 'Los campos categoria y descripcion son requeridos y no pueden estar vacíos' 
        });
      }
      
      // Verificar duplicados
      const { data: existingCategoria } = await supabase
        .from('categoria_empresa')
        .select('id_categoria')
        .ilike('categoria', categoria.trim())
        .single();

      if (existingCategoria) {
        return res.status(400).json({ 
          error: 'Ya existe una categoría con ese nombre' 
        });
      }
      
      const { data, error } = await supabase
        .from('categoria_empresa')
        .insert([{ 
          categoria: categoria.trim(), 
          descripcion: descripcion.trim(),
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
  },

  // Actualizar categoría
  updateCategoria: async (req, res) => {
    console.log('Iniciando updateCategoria...');
    try {
      const { id } = req.params;
      const { categoria, descripcion } = req.body;
      console.log('Actualizando categoría:', { id, categoria, descripcion });

      // Validación de campos requeridos
      if (!categoria?.trim() || !descripcion?.trim()) {
        return res.status(400).json({ 
          error: 'Los campos categoria y descripcion son requeridos y no pueden estar vacíos' 
        });
      }

      // Verificar existencia y duplicados
      const [{ data: existingCategoria }, { data: duplicateCategoria }] = await Promise.all([
        supabase
          .from('categoria_empresa')
          .select('id_categoria')
          .eq('id_categoria', id)
          .single(),
        supabase
          .from('categoria_empresa')
          .select('id_categoria')
          .ilike('categoria', categoria.trim())
          .neq('id_categoria', id)
          .single()
      ]);

      if (!existingCategoria) {
        return res.status(404).json({ 
          error: 'No se encontró la categoría a actualizar' 
        });
      }

      if (duplicateCategoria) {
        return res.status(400).json({ 
          error: 'Ya existe otra categoría con ese nombre' 
        });
      }
      
      const { data, error } = await supabase
        .from('categoria_empresa')
        .update({ 
          categoria: categoria.trim(), 
          descripcion: descripcion.trim() 
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
  },

  // Eliminar categoría
  deleteCategoria: async (req, res) => {
    console.log('Iniciando deleteCategoria...');
    try {
      const { id } = req.params;
      console.log('Verificando uso de categoría con ID:', id);
      
      // Verificar existencia de la categoría
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

      // Verificar empresas vinculadas
      const { data: empresasVinculadas, error: errorConsulta } = await supabase
        .from('Empresas')
        .select('id_empresa, estado')
        .eq('id_categoria', id);
      
      if (errorConsulta) {
        console.error('Error al verificar empresas vinculadas:', errorConsulta);
        return res.status(400).json({ error: errorConsulta.message });
      }

      if (empresasVinculadas?.length > 0) {
        const empresasActivas = empresasVinculadas.filter(empresa => empresa.estado);
        
        if (empresasActivas.length > 0) {
          return res.status(400).json({ 
            error: 'No se puede eliminar la categoría porque está siendo utilizada por empresas activas'
          });
        } else {
          return res.status(400).json({ 
            error: 'No se puede eliminar la categoría porque está vinculada a empresas inactivas'
          });
        }
      }

      // Proceder con la eliminación
      const { error } = await supabase
        .from('categoria_empresa')
        .delete()
        .eq('id_categoria', id);
      
      if (error) {
        if (error.code === '23503') { // Error de clave foránea
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
  }
};

module.exports = CategoriaEmpresaControllerPerdomo;