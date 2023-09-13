const express = require("express");
const fs = require("fs");
const sharp = require("sharp")
const path = require("path");
const port = 8080;
const app = express();
const sass = require("sass");
const formidable = require("formidable");
const AccesBD = require("./module_proprii/accesbd.js");
const session = require('express-session');
const Drepturi = require("./module_proprii/drepturi.js");
const bodyParser = require('body-parser');
const {
    Utilizator
} = require("./module_proprii/utilizator.js");
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
app.use(session({ 
    secret: 'abcdefg', //folosit de express session pentru criptarea id-ului de sesiune
    resave: true,
    saveUninitialized: false
}));
client.connect();

obGlobal = {
    obErori: null,
    obImagini: null,
    cat: null,
    optiuniMeniu: []
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

app.use(
    express.static(__dirname + "/poze_uploadate")
);

//Incarcare categorii dinamic
app.use("/node_modules", express.static(__dirname + "/node_modules"));
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


app.use("/*", function (req, res, next) {
    res.locals.optiuniMeniu = obGlobal.optiuniMeniu;
    res.locals.Drepturi = Drepturi;
    if (req.session.utilizator) {
        req.utilizator = res.locals.utilizator = new Utilizator(req.session.utilizator);
    }
    next();
});
app.get("/favicon.ico", function (req, res) {
    res.sendFile(__dirname + "/resurse/favicon-32x32.png");
});
app.get(/^\/resurse(\/[a-zA-Z0-9]*(?!\.)[a-zA-Z0-9]*)*$/, function (req, res) {
    initializeazaErori(res, 403);
});

//mainpage
app.get(["/", "/index", "/home"], function (req, res) {

    res.render('pagini/index', {
        ip: req.ip,
        a: 10,
        b: 20,
        imagini: obGlobal.obImagini.imagini,
        session: req.session,
        cat: res.locals.cat
    });
});


//Cursuri
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
                        session: req.session,
                        cat: res.locals.cat,
                        pret_min: minPrice,
                        pret_max: maxPrice
                    });
                })
                .catch(error => {
                    console.error('Error:', error);
                    afiseazaEroare(res, 404);
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
                    session: req.session,
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
                cat: res.locals.cat,
                session: req.session
            });
    });
});
//--------------------------------------------------------------------------------------

//Utilizatori
app.post("/autentificare", function (req, res) {
    var username;
    var poza;
    var formular = new formidable.IncomingForm();
    formular.parse(req, function (err, campuriText, campuriFisier) {
        console.log("Inregistrare:", campuriText);
        poza = path.join(__dirname, "poze_uploadate", username, username + ".jpg");
        console.log(poza);
        console.log(campuriFisier);
        console.log(poza, username);
        var eroare = "";

        var utilizNou = new Utilizator();
        try {
            utilizNou.setareNume = campuriText.nume;
            utilizNou.setareUsername = campuriText.username;
            utilizNou.email = campuriText.email;
            utilizNou.prenume = campuriText.prenume;
            utilizNou.parola = campuriText.parola;
            utilizNou.culoare_chat = campuriText.culoare_chat;
            utilizNou.poza = poza;
            Utilizator.getUtilizDupaUsername(campuriText.username, {}, function (u, parametru, eroareUser) {
                if (eroareUser == -1) { //nu exista username-ul in BD
                    utilizNou.salvareUtilizator();
                } else {
                    eroare += "Mai exista username-ul";
                }

                if (!eroare) {
                    res.render("pagini/autentificare", {
                        raspuns: "Inregistrare cu succes!"
                    })

                } else
                    res.render("pagini/autentificare", {
                        err: "Eroare: " + eroare
                    });
            })


        } catch (e) {
            console.log(e);
            eroare += "Eroare site; reveniti mai tarziu";
            console.log(eroare);
            res.render("pagini/autentificare", {
                err: "Eroare: " + eroare
            })
        }




    });
    formular.on("field", function (nume, val) { // 1 

        console.log(`--- ${nume}=${val}`);

        if (nume == "username")
            username = val;
    })
    formular.on("fileBegin", function (nume, fisier) { //2
        console.log("!!fileBegin");
        let folderUser = path.join(__dirname, "poze_uploadate", username);
        console.log(folderUser);
        if (!fs.existsSync(folderUser)) {
            try {
                fs.mkdirSync(folderUser);
                console.log("Directory created successfully:", folderUser);
            } catch (err) {
                console.error("Failed to create directory:", err);
            }
        }

        fisier.filepath = path.join(folderUser, username + '.jpg');
        poza = username + '.jpg';
        //fisier.filepath=folderUser+"/"+fisier.originalFilename
        console.log("fileBegin:", poza)
        console.log("fileBegin, fisier:", fisier)

    })
    formular.on("file", function (nume, fisier) { //3
        console.log("file");
        console.log(nume, fisier);
    });


});
app.post("/edit-profil", function(req, res){
    console.log("profil");
    if (!req.session.utilizator){
        afiseazaEroare(res,403,)
        res.render("pagini/eroare_generala",{text:"Nu sunteti logat."});
        return;
    }
    var formular= new formidable.IncomingForm();
 
    formular.parse(req,function(err, campuriText, campuriFile){
        console.log(campuriText); 
        AccesBD.getInstanta().updateParametrizat(
            {tabel:"utilizatori",
            campuri:["nume","prenume","email","culoare_chat"],
            valori:[`${campuriText.nume}`,`${campuriText.prenume}`,`${campuriText.email}`,`${campuriText.culoare_chat}`],
            conditiiAnd:[`username='${campuriText.username}'`]
        },          
        function(err, rez){
            console.log("update"); 
            if(err){
                console.log(err);
                afisareEroare(res,2);
                return;
            }
            console.log(rez.rowCount);
            if (rez.rowCount==0){
                res.render("pagini/profil",{mesaj:"Update-ul nu s-a realizat. Verificati parola introdusa."});
                return;
            }
            else{            
                //actualizare sesiune
                console.log("ceva");
                req.session.utilizator.nume= campuriText.nume;
                req.session.utilizator.prenume= campuriText.prenume;
                req.session.utilizator.email= campuriText.email;
                req.session.utilizator.culoare_chat= campuriText.culoare_chat;
                res.locals.utilizator=req.session.utilizator;
            }
 
 
            res.render("pagini/profil",{mesaj:"Update-ul s-a realizat cu succes."});
 
        });
       
 
    });
});
app.post("/login", function (req, res) {
    console.log("ceva");
    var formular = new formidable.IncomingForm();
    formular.parse(req, function (err, campuriText, campuriFisier) {
        Utilizator.getUtilizDupaUsername(campuriText.username, {
            req: req,
            res: res,
            parola: campuriText.parola
        }, function (u, obparam) {
            let parolaCriptata = Utilizator.criptareParola(obparam.parola);
            console.log('!! ' + u.confirmat_mail);
            if (u.parola == parolaCriptata && u.confirmat_mail) {
                u.poza = u.poza ? path.join("poze_uploadate", u.username, u.poza) : "";
                obparam.req.session.utilizator = u;
                obparam.req.session.mesajLogin = "Bravo! Te-ai logat!";
                obparam.req.session.mesajLoginTip = "ok";
                obparam.res.redirect("/index");
                //obparam.res.render("/login");
            } else {
                console.log("Eroare logare")
                obparam.req.session.mesajLogin = "Date logare incorecte sau nu a fost confirmat mailul!";
                obparam.req.session.mesajLoginTip = "eroare";
                obparam.res.redirect("/index");
            }
        })
    });
});

app.get("/cod_mail/:token/:username", function (req, res) {
    console.log(req.params);
    try {
        Utilizator.getUtilizDupaUsername(req.params.username, {
            res: res,
            token: req.params.token
        }, function (u, obparam) {
            AccesBD.getInstanta().update({
                    tabel: "utilizator",
                    campuri: {
                        confirmat_mail: 'true'
                    },
                    conditiiAnd: [`cod='${obparam.token}'`]
                },
                function (err, rezUpdate) {
                    if (err || rezUpdate.rowCount == 0) {
                        console.log("Cod:", err);
                        showError(res, req.session, 3);
                    } else {
                        res.render("pagini/confirmare.ejs", {
                            cat: res.locals.cat,
                            session: req.session
                        });
                    }
                })
        })
    } catch (e) {
        console.log(e);
        showError(res, req.session, 2);
    }
});
app.get("/profil", function (req, res) {
    const utilizator = req.session.utilizator;
    const utilizatorInstance = new Utilizator(utilizator);
    res.render('pagini/profil', {
        ip: req.ip,
        imagini: obGlobal.obImagini.imagini,
        session: req.session,
        cat: res.locals.cat,
        utilizator: utilizatorInstance,
        profile_pic: utilizatorInstance.poza
    });
});
//------------------------------------------------------
app.get("/certificate", function (req, res) {
    function getRandomNumber(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    let randomNumbers = [];
    while (randomNumbers.length < 5) {
        let randomNumber = getRandomNumber(0, 5);
        if (!randomNumbers.includes(randomNumber)) {
            randomNumbers.push(randomNumber);
        }
    }
    console.log(randomNumbers);
    res.render('pagini/certificate', {
        ip: req.ip,
        imagini: obGlobal.obImagini.imagini,
        session: req.session,
        randomIndex: randomNumbers,
        cat: res.locals.cat
    });
});
//------------Cos virtual-----------------------------------------
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/cos', function (req, res) {
    const cartIds = req.session.cart || []; 
  
    const query = 'SELECT * FROM public."Cursuri" WHERE id = ANY($1)';
    client.query(query, [cartIds], (error, result) => {
      if (error) {
        afiseazaEroare(res, 2);
      }
  
      const produse = result.rows;
  
      res.render('pagini/cos', {
        session: req.session,
        cat: res.locals.cat,
        produse: produse 
      });
    });
  });

app.post('/checkoutProduct', (req, res) => {
    const cursId = req.body.cursId;
    if (!req.session.cart) {
      req.session.cart = [];
    }
    req.session.cart.push(cursId);
    console.log('-----------------------------------------');
    console.log(req.session.cart);
  
    res.redirect('/cursuri');
  });

  app.post('/placeOrder', async (req, res) => {
    const formData = req.body;

    const fullName = formData.fullName;
    const email = formData.email;
    const phone = formData.phone;
    const workNumber = formData.workNumber || "";
    const workAddress = formData.workAddress || "";

    const emailSubject = "Placed Order Details";
    const emailBody = `<h4>Order Details:</h4>
        <p>Full Name: ${fullName}</p>
        <p>Email: ${email}</p>
        <p>Phone Number: ${phone}</p>
        <p>Work Number: ${workNumber}</p>
        <p>Work Address: ${workAddress}</p>`;

    try {
        // Send the email
        await Utilizator.trimiteMail(emailSubject, emailBody, email); // Pass the 'email' parameter

        // Handle success (redirect, display confirmation, etc.)
        res.redirect('/cos');
    } catch (error) {
        // Handle error (display error page, show error message, etc.)
        res.redirect('/cos');
    }
});
//-------------------------------------------------------------------



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