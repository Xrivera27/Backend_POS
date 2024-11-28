//const cronHolaMundo = require('./holaMundo.js');
const rBsinGuardar = require('./restaurarRollBack.js');
const rBsGuardado = require('./restaurarRollBackGuardado.js');
const {cron: dscPromos} = require('./desactivarPromociones.js');
const {cron: actPromos} = require('./activarPromociones.js');
const {cron: alertPromProduct} = require('./alertPromProduct.js');
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