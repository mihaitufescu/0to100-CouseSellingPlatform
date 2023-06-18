const express = require("express");
const fs = require("fs");
const sharp = require("sharp")
const path = require("path");
const port = 8080;
const app = express();
const sass = require("sass");
const {
    Client
} = require("pg");
var client = new Client({
    database: "postgres",
    user: "mihai",
    password: "123456",
    host: "localhost",
    port: 5433
});
client.connect();
const searchDate = '2023-06-05'; // The date you want to search
obGlobal = {
    obErori: null,
    obImagini: null,
    cat: null
}

const folders = ["temp", "temp1", "resurse/backup"];
const filePaths = {
    fileSCSS: __dirname + "/resurse/styles/sass",
    fileCSS: __dirname + "/resurse/styles",
    filesccs_ejs: __dirname + "/resurse/styles/scss_ejs",
    fileBackup: __dirname + "/resurse/styles/backup"
}
for (let folder of folders) {
    let folderPath = path.join(__dirname, folder);

    if (!fs.existsSync(folderPath))
        fs.mkdirSync(folderPath);

}

let files = fs.readdirSync(filePaths.fileSCSS);

for (let file of files) {
    if (path.extname(file) == ".scss")
        compileCss(file);
}

fs.watch(filePaths.fileSCSS, function (event, file) {
    if (event == "change" || event == "rename") {
        let filePath = path.join(filePaths.fileSCSS, file);
        if (fs.existsSync(filePath))
            compileCss(filePath);
    }
})

function compileCss(caleScss, caleCss) {
    if (!caleCss) {
        let fileExtension = path.basename(caleScss);
        let file = fileExtension.split(".")[0];
        caleCss = file + ".css";
    }

    if (!path.isAbsolute(caleScss))
        caleScss = path.join(filePaths.fileSCSS, caleScss);

    if (!path.isAbsolute(caleCss))
        caleCss = path.join(filePaths.fileCSS, caleCss);

    let backupPath = path.join(filePaths.fileBackup, "/resurse/css");

    if (!fs.existsSync(backupPath)) {
        fs.mkdirSync(backupPath, {
            recursive: true
        });
    }

    let fileCssCompiled = path.basename(caleScss);

    if (fs.existsSync(caleCss)) {
        fs.copyFileSync(caleCss, path.join(filePaths.fileBackup, fileCssCompiled));
    }

    rez = sass.compile(caleScss, {
        "sourceMap": true
    });
    fs.writeFileSync(caleCss, rez.css);
}


app.set("view engine", "ejs");
app.set("views", "views/");

app.use(
    express.static(__dirname + "/resurse")
);
app.use(function (req, res, next) {
    client.query(`SELECT DISTINCT unnest(array_agg(categorie_principala)) AS entry FROM public."Cursuri"`, function (err, rez) {
        if (err) {
            console.log(err);
            afiseazaEroare(res, 2);
        }
        var cat = rez.rows;
        res.locals.cat = cat; // Make `cat` data available to all routes
        next(); // Proceed to the next middleware or route handler
    });
});

app.get(/^\/resurse(\/[a-zA-Z0-9]*(?!\.)[a-zA-Z0-9]*)*$/, function (req, res) {
    initializeazaErori(res, 403);
});
app.get("/cursuri", function (req, res) {


    //TO DO query pentru a selecta toate produsele
    //TO DO se adauaga filtrarea dupa tipul produsului
    //TO DO se selecteaza si toate valorile din enum-ul categ_prajitura
    client.query('select * from public."Cursuri"', function (err, rez) {
        console.log(300);
        if (err) {
            console.log(err);
            afiseazaEroare(res, 2);
        } else {
            //console.log(rez);
            const minQuery = client.query('SELECT MIN(pret) FROM public."Cursuri"');
            const maxQuery = client.query('SELECT MAX(pret) FROM public."Cursuri"');

            Promise.all([minQuery, maxQuery])
                .then(([minResult, maxResult]) => {
                    const minPrice = minResult.rows[0].min;
                    const maxPrice = maxResult.rows[0].max;

                    res.render("pagini/cursuri", {
                        cursuri: rez.rows,
                        optiuni: [],
                        cat: res.locals.cat,
                        pret_min: minPrice,
                        pret_max: maxPrice
                    });
                })
                .catch(error => {
                    console.error('Error:', error);
                    afiseazaEroare(res,404);
                });
        }

    });


});
app.get("/cursuri/:subcategory", function (req, res) {
    let subcategory = req.params.subcategory;
    let matchedCategory = null;

    for (let i = 0; i < res.locals.cat.length; i++) {
        let category = res.locals.cat[i].entry;
        let normalizedCategory = category.toLowerCase().replace(/\s/g, "");

        if (normalizedCategory === subcategory) {
            matchedCategory = category;
            break;
        }
    }

    if (matchedCategory) {
        let query = 'select * from public."Cursuri" where categorie_principala = $1';
        let values = [matchedCategory];

        client.query(query, values, function (err, result) {
            if (err) {
                console.log(err);
                afiseazaEroare(res, 2);
            } else {
                console.log(result);
                res.render("pagini/cursuri", {
                    cursuri: result.rows,
                    optiuni: [],
                    cat: res.locals.cat
                });
            }
        });
    } else {
        console.log("Subcategorie inexistenta");
        afiseazaEroare(res, 2);
    }
});


app.get("/curs/:id", function (req, res) {
    console.log(req.params);

    client.query(`select * from public."Cursuri" where id=${req.params.id}`, function (err, rezultat) {
        if (err) {
            console.log(err);
            afiseazaEroare(res, 2);
        } else
            res.render("pagini/curs", {
                curs: rezultat.rows[0],
                cat: res.locals.cat
            });
    });
});

app.get(["/", "/index", "/home"], function (req, res) {
    res.render('pagini/index', {
        ip: req.ip,
        a: 10,
        b: 20,
        imagini: obGlobal.obImagini.imagini,
        cat: res.locals.cat
    });
});

app.get("/*.ejs", function (req, res) {
    afiseazaEroare(res, 400);
});

app.get("/favicon.ico", function (req, res) {
    res.sendFile(__dirname + "/res/ico/favicon-32x32.png");
});

app.get("/*", function (req, res) {

    return res.render('pagini/' + req.url, {
        cat: res.locals.cat
    }, function (err, result) {
        if (err) {
            if (err.message.startsWith("Failed to lookup view"))
                afiseazaEroare(res, 404, "ceva");
            else
                afiseazaEroare(res);
        } else
            return res.send(result);
    });
});

function initializeazaErori() {
    var continut = fs.readFileSync(__dirname + "/resurse/json/erori.json").toString('utf8');
    obGlobal.obErori = JSON.parse(continut);
    let vErori = obGlobal.obErori.info_erori;
    for (let eroare of vErori) {
        eroare.imagine = "/" + obGlobal.obErori.cale_baza + "/" + eroare.imagine;
    }
}
initializeazaErori();

function afiseazaEroare(res, _identificator, _titlu = "titlu default", _text, _imagine) {
    let vErori = obGlobal.obErori.info_erori;
    let eroare = vErori.find(function (elem) {
        return elem.identificator == _identificator;
    });
    if (eroare) {
        let titlu1 = _titlu == "titlu default" ? (eroare.titlu || _titlu) : _titlu;
        let text1 = _text || eroare.text;
        let imagine1 = _imagine || eroare.imagine;
        if (eroare.status)
            res.status(eroare.identificator).render("pagini/eroare", {
                titlu: titlu1,
                text: text1,
                imagine: imagine1
            });
        else
            res.render("pagini/eroare", {
                titlu: titlu1,
                text: text1,
                imagine: imagine1
            });
    } else {
        let errDef = obGlobal.obErori.eroare_default;
        res.render("pagini/eroare", {
            titlu: errDef.titlu,
            text: errDef.text,
            imagine: obGlobal.obErori.cale_baza + "/" + errDef.imagine
        });
    }
}

function initializeazaImagini() {
    var continut = fs.readFileSync(__dirname + "/resurse/json/galerie.json").toString('utf8');
    obGlobal.obImagini = JSON.parse(continut);
    const vImagini = obGlobal.obImagini.imagini;
    let caleAbs = path.join(__dirname, "resurse", obGlobal.obImagini.cale_galerie);
    let caleAbsMediu = path.join(caleAbs, "mediu");
    if (!fs.existsSync(caleAbsMediu)) {
        fs.mkdirSync(caleAbsMediu);
    }
    for (let imag of vImagini) {
        [numeFis, ext] = imag.fisier.split(".");
        imag.fisier_mediu = path.join(obGlobal.obImagini.cale_galerie, "mediu", numeFis + ".webp");
        let caleAbsFisMediu = path.join(__dirname, "resurse", imag.fisier_mediu);
        sharp(path.join(caleAbs, imag.fisier)).resize(400).toFile(caleAbsFisMediu);
        imag.fisier = path.join(obGlobal.obImagini.cale_galerie, imag.fisier);
    }
}

initializeazaImagini();

var server = app.listen(port, function () {
    console.log('Node server is running..');
});