const {
    Client,
    Pool
} = require("pg");


class AccesBD {
    static  #instanta = null;
    static  #initializat = false;

    constructor() {
        if (AccesBD.#instanta) {
            throw new Error("Deja a fost instantiat");
        } else if (!AccesBD.#initializat) {
            throw new Error("Trebuie apelat doar din getInstanta; fara sa fi aruncat vreo eroare");
        }
    }

    initLocal() {
        this.client = new Client({
            database: "postgres",
            user: "mihai",
            password: "123456",
            host: "localhost",
            port: 5433
        });
        this.client.connect();
    }

    getClient() {
        if (!AccesBD.#instanta) {
            throw new Error("Nu a fost instantiata clasa");
        }
        return this.client;
    }

    /**
     * @typedef {object} ObiectConexiune - obiect primit de functiile care realizeaza un query
     * @property {string} init - tipul de conexiune ("init", "render" etc.)
     * 
     * /

    /**
     * Returneaza instanta unica a clasei
     *
     * @param {ObiectConexiune} init - un obiect cu datele pentru query
     * @returns {AccesBD}
     */
    static getInstanta({
        init = "local"
    } = {}) {
        console.log(this);
        if (!this.#instanta) {
            this.#initializat = true;
            this.#instanta = new AccesBD();

            try {
                switch (init) {
                    case "local":
                        this.#instanta.initLocal();
                }
                //daca ajunge aici inseamna ca nu s-a produs eroare la initializare

            } catch (e) {
                console.error("Eroare la initializarea bazei de date!");
            }

        }
        return this.#instanta;
    }




    /**
     * @typedef {object} ObiectQuerySelect - obiect primit de functiile care realizeaza un query
     * @property {string} tabel - numele tabelului
     * @property {string []} campuri - o lista de stringuri cu numele coloanelor afectate de query; poate cuprinde si elementul "*"
     * @property {string[]} conditiiAnd - lista de stringuri cu conditii pentru where
     */



    /**
     * callback pentru queryuri.
     * @callback QueryCallBack
     * @param {Error} err Eventuala eroare in urma queryului
     * @param {Object} rez Rezultatul query-ului
     */
    /**
     * Selecteaza inregistrari din baza de date
     *
     * @param {ObiectQuerySelect} obj - un obiect cu datele pentru query
     * @param {function} callback - o functie callback cu 2 parametri: eroare si rezultatul queryului
     */
    select({
        tabel = "",
        campuri = [],
        conditiiAnd = []
    } = {}, callback, parametriQuery = []) {
        let conditieWhere = "";
        if (conditiiAnd.length > 0)
            conditieWhere = `where ${conditiiAnd.join(" and ")}`;
        let comanda = `select ${campuri.join(",")} from ${tabel} ${conditieWhere}`;
        console.error(comanda);
        /*
        comanda=`select id, camp1, camp2 from tabel where camp1=$1 and camp2=$2;
        this.client.query(comanda,[val1, val2],callback)

        */
        this.client.query(comanda, parametriQuery, callback)
    }
    async selectAsync({
        tabel = "",
        campuri = [],
        conditiiAnd = []
    } = {}) {
        let conditieWhere = "";
        if (conditiiAnd.length > 0)
            conditieWhere = `where ${conditiiAnd.join(" and ")}`;

        let comanda = `select ${campuri.join(",")} from ${tabel} ${conditieWhere}`;
        console.error("selectAsync:", comanda);
        try {
            let rez = await this.client.query(comanda);
            console.log("selectasync: ", rez);
            return rez;
        } catch (e) {
            console.log(e);
            return null;
        }
    }
    insert({
        tabel = "",
        campuri = {}
    } = {}, callback) {
        console.log("-------------------------------------------")
        console.log(Object.keys(campuri).join(","));
        console.log(Object.values(campuri).join(","));
        let comanda = `insert into ${tabel}(${Object.keys(campuri).join(",")}) values ( ${Object.values(campuri).map((x) => `'${x}'`).join(",")})`;
        console.log(comanda);
        this.client.query(comanda, callback)
    }

    /**
     * @typedef {object} ObiectQuerySelect - obiect primit de functiile care realizeaza un query
     * @property {string} tabel - numele tabelului
     * @property {string []} campuri - o lista de stringuri cu numele coloanelor afectate de query; poate cuprinde si elementul "*"
     * @property {string[]} conditiiAnd - lista de stringuri cu conditii pentru where
     */
    // update({tabel="",campuri=[],valori=[], conditiiAnd=[]} = {}, callback, parametriQuery){
    //     if(campuri.length!=valori.length)
    //         throw new Error("Numarul de campuri difera de nr de valori")
    //     let campuriActualizate=[];
    //     for(let i=0;i<campuri.length;i++)
    //         campuriActualizate.push(`${campuri[i]}='${valori[i]}'`);
    //     let conditieWhere="";
    //     if(conditiiAnd.length>0)
    //         conditieWhere=`where ${conditiiAnd.join(" and ")}`;
    //     let comanda=`update ${tabel} set ${campuriActualizate.join(", ")}  ${conditieWhere}`;
    //     console.log(comanda);
    //     this.client.query(comanda,callback)
    // }

    update({
        tabel = "",
        campuri = {},
        conditiiAnd = []
    } = {}, callback, parametriQuery) {
        let campuriActualizate = [];
        for (let prop in campuri)
            campuriActualizate.push(`${prop}='${campuri[prop]}'`);
        let conditieWhere = "";
        if (conditiiAnd.length > 0)
            conditieWhere = `where ${conditiiAnd.join(" and ")}`;
        let comanda = `update ${tabel} set ${campuriActualizate.join(", ")}  ${conditieWhere}`;
        console.log(comanda);
        this.client.query(comanda, callback)
    }

    updateParametrizat({
        tabel = "",
        campuri = [],
        valori = [],
        conditiiAnd = []
    } = {}, callback, parametriQuery) {
        if (campuri.length != valori.length)
            throw new Error("Numarul de campuri difera de nr de valori")
        let campuriActualizate = [];
        for (let i = 0; i < campuri.length; i++)
            campuriActualizate.push(`${campuri[i]}=$${i+1}`);
        let conditieWhere = "";
        if (conditiiAnd.length > 0)
            conditieWhere = `where ${conditiiAnd.join(" and ")}`;
        let comanda = `update ${tabel} set ${campuriActualizate.join(", ")}  ${conditieWhere}`;
        console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!1111", comanda);
        this.client.query(comanda, valori, callback)
    }


    //TO DO
    // updateParametrizat({tabel="",campuri={}, conditiiAnd=[]} = {}, callback, parametriQuery){
    //     let campuriActualizate=[];
    //     for(let prop in campuri)
    //         campuriActualizate.push(`${prop}='${campuri[prop]}'`);
    //     let conditieWhere="";
    //     if(conditiiAnd.length>0)
    //         conditieWhere=`where ${conditiiAnd.join(" and ")}`;
    //     let comanda=`update ${tabel} set ${campuriActualizate.join(", ")}  ${conditieWhere}`;
    //     this.client.query(comanda,valori, callback)
    // }

    delete({
        tabel = "",
        conditiiAnd = []
    } = {}, callback) {
        let conditieWhere = "";
        if (conditiiAnd.length > 0)
            conditieWhere = `where ${conditiiAnd.join(" and ")}`;

        let comanda = `delete from ${tabel} ${conditieWhere}`;
        console.log(comanda);
        this.client.query(comanda, callback)
    }

    query(comanda, callback) {
        this.client.query(comanda, callback);
    }

}

module.exports = AccesBD;