// Cargar variables de entorno
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const { sessionActiva } = require('./middlewares/sessionMiddleware.js');
const routes = require('./routes'); // Importar el index de rutas
const {tareasArranque} = require('./Tasks/tareas-arranque/startTareasArranque.js');
require('./Tasks/cron-jobs/startTasks.js'); //Importamos e iniciamos los cron jobs

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
tareasArranque();

// Iniciar el servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
