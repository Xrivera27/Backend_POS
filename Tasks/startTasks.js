//const cronHolaMundo = require('./holaMundo.js');
const rBsinGuardar = require('./restaurarRollBack.js');
const rBsGuardado = require('./restaurarRollBackGuardado.js');
const dscPromos = require('./desactivarPromociones.js');
const actPromos = require('./activarPromociones.js');
const alertPromProduct = require('./alertPromProduct.js');

function startCrons(){
    rBsinGuardar;
    rBsGuardado;
    dscPromos;
    actPromos;
    alertPromProduct;
}

module.exports = startCrons;