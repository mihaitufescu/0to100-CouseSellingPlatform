
/**
 @typedef Drepturi
 @type {Object}
 @property {Symbol} vizualizareUtilizatori Dreptul de a intra pe  pagina cu tabelul de utilizatori.
 @property {Symbol} stergereUtilizatori Dreptul de a sterge un utilizator
 @property {Symbol} cumparareProduse Dreptul de a cumpara
 @property {Symbol} actualizareDatePers Dreptul de actualiza contul
 @property {Symbol} schimbareParola Dreptul de a schimba parola
 @property {Symbol} makeAdmin Dreptul de a da dreptul de admin
 @property {Symbol} vizualizareGrafice Dreptul de a vizualiza graficele de vanzari
 */


/**
 * @name module.exports.Drepturi
 * @type Drepturi
 */
const Drepturi = {
	vizualizareUtilizatori: Symbol("vizualizareUtilizatori"),
	stergereUtilizatori: Symbol("stergereUtilizatori"),
	cumparareProduse: Symbol("cumparareProduse"),
	vizualizareGrafice: Symbol("vizualizareGrafice"),
	actualizareDatePers: Symbol("actualizareDatePers"),
	makeAdmin: Symbol("makeAdmin"),
	schimbareParola: Symbol("schimbareParola")
}

module.exports=Drepturi;