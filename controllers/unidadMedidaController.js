const { getEmpresaId } = require('../db/empresaSvc.js');

const getUnidad = async (req, res) => {
    const supabase = req.supabase;

    try {
        const { data: unidad, error } = await supabase
        .from('unidad_de_medida')
        .select('*');

        if (error){
            res.status(500).json({ Error: 'Error al obtener unidad' + error.message });
        }
        res.status(200).json(unidad);

    } catch (error) {
        res.status(500).json({ Error: 'Ocurrio un error al obtener unidad' + error.message });
    }
}

const getUnidadbyUsuario = async (req, res) => {
    const supabase = req.supabase;
   try {
    const id_usuario = req.params.id_usuario;
    const id_empresa_param = await getEmpresaId(id_usuario, supabase);
    

    const { data: unidad, error } = await supabase
    .from('unidad_de_medida')
    .select('id_medida, medida')
    .eq('id_empresa', id_empresa_param);

    if(error){
        return res.status(500);
    }
 
    res.status(200).json(unidad);
   } catch (error) {
    throw error;
   }
}

const getProductosUnidad = async (req, res) => {
    const supabase = req.supabase;
    const id_unidad = req.params.id_unidad;
  
    try {
        const { data: productos, error } = await supabase
        .from('producto')
        .select('codigo_producto, nombre')
        .eq('id_unidad_medida', id_unidad);
  
      if (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error al obtener los productos' });
      }
  
      res.status(200).json(productos);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

const getTotalUnidadporProducto = async (req, res) => {
    const supabase = req.supabase;
  
    try {
      const id_unidad = req.params.id_unidad;
  
      const { count, error } = await supabase
        .from('producto')
        .select('*', { count: "exact", head: true }) // head: true para que solo cuente y no traiga datos
        .eq('id_unidad_medida', id_unidad);
  
      if (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error al obtener el conteo' });
      }
  
      res.status(200).json({ total: count });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
  

const postUnidad = async (req, res) => {
    const supabase = req.supabase;
    const { medida, id_usuario } = req.body;

    try {
       
        const id_empresa = await getEmpresaId(id_usuario, supabase);

        const { data: unidad, error } = await supabase.from('unidad_de_medida').insert(
            {
            medida: medida,
            id_empresa: id_empresa,
        }).select('id_medida, medida');

        if(error) {

         return res.status(500).json({error: error.message});
        }

        res.status(200).json(unidad);

    } catch (error) {
        console.log('ha habido un error en la api');
        res.status(500).json({error: error.message});
    }
}

const patchUnidad = async (req, res) => {
    const supabase = req.supabase;
    const { medida } = req.body;
    const id_unidad_medida = req.params.id_unidad_medida;
    
    try {
        const { data, error } = await supabase.from('unidad_de_medida').update(
            {medida: medida,
        }).eq('id_medida', id_unidad_medida);

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
    getUnidad, getUnidadbyUsuario, patchUnidad, postUnidad, getTotalUnidadporProducto, getProductosUnidad
 }