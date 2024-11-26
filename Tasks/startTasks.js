//const cronHolaMundo = require('./holaMundo.js');
const rBsinGuardar = require('./restaurarRollBack.js');
const rBsGuardado = require('./restaurarRollBackGuardado.js');
const dscPromos = require('./desactivarPromociones.js');
const actPromos = require('./activarPromociones.js');
const alertPromProduct = require('./alertPromProduct.js');
const alertPromCategory = require('./alertPromCategory.js');

function startCrons(){
    rBsinGuardar;
    rBsGuardado;
    dscPromos;
    actPromos;
    alertPromProduct;
    alertPromCategory;
}

module.exports = startCrons;