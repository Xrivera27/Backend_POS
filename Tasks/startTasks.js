//const cronHolaMundo = require('./holaMundo.js');
const rBsinGuardar = require('./restaurarRollBack.js');
const rBsGuardado = require('./restaurarRollBackGuardado.js');
const dscPromos = require('./desactivarPromociones.js');

function startCrons(){
    rBsinGuardar;
    rBsGuardado;
    dscPromos;
}

module.exports = startCrons;