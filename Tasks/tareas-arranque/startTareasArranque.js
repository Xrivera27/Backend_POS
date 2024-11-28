const { activarPromociones } = require('../cron-jobs/activarPromociones');
const { desactivarPromocionesFunction } = require('../cron-jobs/desactivarPromociones');
const {getProximasAlerts: promoProductAlerts } = require('../cron-jobs/alertPromProduct');
const {getProximasAlerts: promoCategoryAlerts } = require('../cron-jobs/alertPromCategory');

function tareasArranque(){
    activarPromociones();
    desactivarPromocionesFunction();
    promoProductAlerts();
    promoCategoryAlerts();
}

module. exports = { tareasArranque }