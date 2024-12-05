const { activarPromociones } = require('../cron-jobs/activarPromociones');
const { desactivarPromocionesFunction } = require('../cron-jobs/desactivarPromociones');
const {getProximasAlerts: promoProductAlerts } = require('../cron-jobs/alertPromProduct');
const {getProximasAlerts: promoCategoryAlerts } = require('../cron-jobs/alertPromCategory');
const { mostrarResultado } = require('../cron-jobs/desactivarSAR.js');

function tareasArranque(){
    activarPromociones();
    desactivarPromocionesFunction();
    promoProductAlerts();
    promoCategoryAlerts();
    mostrarResultado();
}

module. exports = { tareasArranque }