const { Client } = require("pg");

class AccesBD {
  static _instanta = null;
  static _initializat = false;

  constructor() {
    if (AccesBD._instanta) {
      throw new Error("Deja a fost instantiat");
    } else if (!AccesBD._initializat) {
      throw new Error(
        "Trebuie apelat doar din getInstanta; fara sa fi aruncat vreo eroare"
      );
    }
  }

  initLocal() {
    this.client = new Client({
      database: "postgres",
      user: "postgres",
      password: "123456",
      host: "localhost",
      port: 5433,
    });
    this.client.connect();
  }

  getClient() {
    if (!AccesBD._instanta) {
      throw new Error("Nu a fost instantiata clasa");
    }
    return this.client;
  }

  /**
   * @typedef {object} ObiectConexiune - obiect primit de functiile care realizeaza un query
   * @property {string} init - tipul de conexiune ("init", "render" etc.)
   */
  /**
   * Returneaza instanta unica a clasei
   *
   * @param {ObiectConexiune} init - un obiect cu datele pentru query
   * @returns {AccesBD}
   */
  static getInstanta({ init = "local" } = {}) {
    if (!this._instanta) {
      this._initializat = true;
      this._instanta = new AccesBD();

      try {
        switch (init) {
          case "local":
            this._instanta.initLocal();
            break;
        }
        // Daca ajunge aici inseamna ca nu s-a produs eroare la initializare
      } catch (e) {
        console.error("Eroare la initializarea bazei de date!");
      }
    }
    return this._instanta;
  }

  /**
   * @typedef {object} ObiectQuerySelect - obiect primit de functiile care realizeaza un query
   * @property {string} tabel - numele tabelului
   * @property {string []} campuri - o lista de stringuri cu numele coloanelor afectate de query; poate cuprinde si elementul "*"
   * @property {string[]} conditiiAnd - lista de stringuri cu conditii pentru where
   */
  /**
   * Selecteaza inregistrari din baza de date
   *
   * @param {ObiectQuerySelect} obj - un obiect cu datele pentru query
   * @param {function} callback - o functie callback cu 2 parametri: eroare si rezultatul queryului
   * @param {Array} parametriQuery - parametri suplimentari pentru query
   */
  select(
    { tabel = "", campuri = [], conditiiAnd = [] } = {},
    callback,
    parametriQuery = []
  ) {
    let conditieWhere = "";
    if (conditiiAnd.length > 0)
      conditieWhere = `where ${conditiiAnd.join(" and ")}`;
    let comanda = `select ${campuri.join(",")} from ${tabel} ${conditieWhere}`;
    console.error(comanda);
    this.client.query(comanda, parametriQuery, callback);
  }

  /**
   * @typedef {object} ObiectQueryUpdate - obiect primit de functiile care realizeaza un query
   * @property {string} tabel - numele tabelului
   * @property {object} campuriValori - obiect cu cheile nume de camp si valoare
   * @property {string[]} conditiiAnd - lista de stringuri cu conditii pentru where
   */
  /**
   * Face update intr-un tabel
   *
   * @param {ObiectQueryUpdate} obj - un obiect cu datele pentru query
   * @param {function} callback - o functie callback cu 2 parametri: eroare si rezultatul queryului
   * @param {Array} parametriQuery - parametri suplimentari pentru query
   */
  update(
    { tabel = "", campuriValori = {}, conditiiAnd = [] } = {},
    callback,
    parametriQuery = []
  ) {
    let set = [];
    for (let camp in campuriValori) {
      set.push(`${camp}='${campuriValori[camp]}'`);
    }
    let conditieWhere = "";
    if (conditiiAnd.length > 0)
      conditieWhere = `where ${conditiiAnd.join(" and ")}`;
    let comanda = `update ${tabel} set ${set.join(",")} ${conditieWhere}`;
    console.error(comanda);
    this.client.query(comanda, parametriQuery, callback);
  }
  updateParametrizat({tabel="",campuri=[],valori=[], conditiiAnd=[]} = {}, callback, parametriQuery){
    if(campuri.length!=valori.length)
        throw new Error("Numarul de campuri difera de nr de valori")
    let campuriActualizate=[];
    for(let i=0;i<campuri.length;i++)
        campuriActualizate.push(`${campuri[i]}=$${i+1}`);
    let conditieWhere="";
    if(conditiiAnd.length>0)
        conditieWhere=`where ${conditiiAnd.join(" and ")}`;
    let comanda=`update ${tabel} set ${campuriActualizate.join(", ")}  ${conditieWhere}`;
    console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!1111",comanda);
    this.client.query(comanda,valori, callback)
}
  insert({ tabel = "", campuri = {} } = {}, callback) {
    const columns = Object.keys(campuri).join(",");
    const values = Object.values(campuri)
      .map((value) => `'${value}'`)
      .join(",");
    const query = `INSERT INTO ${tabel} (${columns}) VALUES (${values})`;

    console.log(query);
    this.client.query(query, callback);
  }
}

module.exports = AccesBD;
