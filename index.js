// Cargar variables de entorno
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const { sessionActiva } = require('./middlewares/sessionMiddleware.js');
const routes = require('./routes'); // Importar el index de rutas
require('./Tasks/startTasks.js');

// Inicializar Express
const app = express();
app.use(cors());
app.use(sessionActiva);
app.use(express.json());

// Configurar Supabase y agregarlo al objeto de request
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
app.use((req, res, next) => {
  req.supabase = supabase;
  next();
});

// Rutas
app.use('/api', routes); // Usar el index de rutas

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
