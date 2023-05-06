const express = require("express");
const fs = require("fs");
const sharp = require("sharp")
const path = require("path");
const port = 8080;
const app = express();
const sass = require("sass");
const {Client} = require("pg");
const config=({
    user :'postgres',
    password : '123456',
    port : 5432,
    database : 'postgres'
});
const pool = new Client(config);

obGlobal={
    obErori:null,
    obImagini:null
}
const folders = ["temp", "temp1", "resurse/backup"];
const filePaths = {
    fileSCSS : __dirname + "/resurse/styles/sass",
    fileCSS : __dirname + "/resurse/styles",
    filesccs_ejs : __dirname + "/resurse/styles/scss_ejs",
    fileBackup : __dirname + "/resurse/styles/backup"
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
        fs.mkdirSync(backupPath, { recursive: true });
    }

    let fileCssCompiled = path.basename(caleScss);

    if (fs.existsSync(caleCss)) {
        fs.copyFileSync(caleCss, path.join(filePaths.fileBackup, fileCssCompiled));
    }

    rez = sass.compile(caleScss, { "sourceMap": true });
    fs.writeFileSync(caleCss, rez.css);
}


app.set("view engine", "ejs"); 
app.set("views", "views/");

app.use(
    express.static(__dirname + "/resurse")
);

/*app.get("/", (req,res,next)=>{
    pool.connect(function(err,client,done){
        if(err){
            console.log("Failure to connect "+ err);
        }
        pool.query("select * from public.test", function(err,rez){
            console.log("Eroare BD", err);
            console.log("Rezultat BD", rez);
        });
    })
});*/
app.get(/^\/resurse(\/[a-zA-Z0-9]*(?!\.)[a-zA-Z0-9]*)*$/, function(req,res){
    initializeazaErori(res,403);
});
app.get("/ceva",function(req,res){
    res.send("<h1>altceva</h1> ip:"+req.ip);
});

app.get(["/","/index", "/home"], function (req, res) {
    res.render('pagini/index', {ip: req.ip, a:10, b:20, imagini: obGlobal.obImagini.imagini});
});

app.get("/*.ejs", function (req, res) {
    afiseazaEroare(res, 400);
});

app.get("/favicon.ico", function (req, res) {
    res.sendFile(__dirname + "/res/ico/favicon-32x32.png");
});

app.get("/*", function(req,res){
    return res.render('pagini/' + req.url, function(err,result)
    {
        if(err)
        {
            if(err.message.startsWith("Failed to lookup view"))
                afiseazaEroare(res, 404, "ceva");
            else
                afiseazaEroare(res);
        }
        else
            return  res.send(result);
    });
});

function initializeazaErori(){
    var continut=fs.readFileSync(__dirname+"/resurse/json/erori.json").toString('utf8');
    obGlobal.obErori = JSON.parse(continut);
    let vErori=obGlobal.obErori.info_erori;
    for(let eroare of vErori){
        eroare.imagine = "/"+obGlobal.obErori.cale_baza+ "/" + eroare.imagine;
    }
}
initializeazaErori();
function afiseazaEroare(res, _identificator, _titlu="titlu default", _text, _imagine){
    let vErori = obGlobal.obErori.info_erori;
    let eroare=vErori.find(function(elem) {return elem.identificator==_identificator;} );
    if(eroare){
        let titlu1= _titlu=="titlu default" ? (eroare.titlu || _titlu) : _titlu;
        let text1= _text || eroare.text;
        let imagine1= _imagine || eroare.imagine;
        if(eroare.status)
            res.status(eroare.identificator).render("pagini/eroare", {titlu:titlu1, text:text1, imagine:imagine1});
        else
            res.render("pagini/eroare", {titlu:titlu1, text:text1, imagine:imagine1});
    }
    else{
        let errDef=obGlobal.obErori.eroare_default;
        res.render("pagini/eroare", {
            titlu:errDef.titlu, text:errDef.text, imagine:obGlobal.obErori.cale_baza+"/"+errDef.imagine
        });
    }
}

function initializeazaImagini(){
    var continut = fs.readFileSync(__dirname + "/resurse/json/galerie.json").toString('utf8');
    obGlobal.obImagini = JSON.parse(continut);
    const vImagini = obGlobal.obImagini.imagini;
    let caleAbs = path.join(__dirname, "resurse", obGlobal.obImagini.cale_galerie);
    let caleAbsMediu = path.join(caleAbs, "mediu");
    if(!fs.existsSync(caleAbsMediu)){
        fs.mkdirSync(caleAbsMediu);
    }
    for(let imag of vImagini){
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