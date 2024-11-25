//const cronHolaMundo = require('./holaMundo.js');
const rBsinGuardar = require('./restaurarRollBack.js');
const rBsGuardado = require('./restaurarRollBackGuardado.js');
const dscPromos = require('./desactivarPromociones.js');
const actPromos = require('./activarPromociones.js');

function startCrons(){
    rBsinGuardar;
    rBsGuardado;
    dscPromos;
    actPromos;
}

module.exports = startCrons;