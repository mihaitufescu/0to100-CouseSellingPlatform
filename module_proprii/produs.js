class Produs{

    constructor({id, nume_curs, descriere, imagine, categorie_principala, complexitate, pret, numar_ore, data_lansare, nume_cursant, categorii_secundare}={}) {

        for(let prop in arguments[0]){
            this[prop]=arguments[0][prop]
        }

    }

}