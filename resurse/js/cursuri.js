window.onload = function () {
    var myModal = document.getElementById('filtrareModal');
    var myInput = document.getElementsByClassName('btn-group-vertical');
    myModal.addEventListener('shown.bs.modal', function () {
        // myInput.focus();
    });
    document.getElementById('filtrare').onclick = function () {
        let denumireCurs = document.getElementById('inp-nume').value.toLowerCase();
        let allCourses = document.getElementById('i_rad4');
        let pretRange = parseFloat(document.getElementById('inp-pret').value);
        let disponibil = document.getElementById('inp-disp').value;
        let cursuri = document.getElementsByClassName('curs');
        let categ = document.getElementById('inp-categorie').value;
        console.log('--------------------------' + cursuri);
        let rBtns = document.getElementsByClassName('rBtn');
        let oreDorite;
        for (let rBtn of rBtns) {
            if (rBtn.checked) {
                oreDorite = rBtn.value;
                break;
            }
        }

        let c = 0;
        for (let curs of cursuri) {

            curs.style.display = 'none';

            let c1;
            if (denumireCurs != null) {

                let denumire = curs.getElementsByClassName('val-nume')[0].innerHTML;
                let replacements = {
                    'ă': 'a',
                    'â': 'a',
                    'î': 'i',
                    'ț': 't',
                    'ș': 's'
                };

                for (let rpl in replacements)
                    denumire = denumire.replace(new RegExp(rpl, 'g'), replacements[rpl]);

                c1 = (denumire.toUpperCase().includes(denumireCurs.toUpperCase()));
            } else
                c1 = true;

            if(c1!=true){
                let descriere = curs.getElementsByClassName('val-descriere')[0].innerHTML;
                const keywordsArr = denumireCurs.split(",");
                console.log(keywordsArr);
                for(let i=0; i< keywordsArr.length; i++){
                    console.log(keywordsArr[i] + ' ' + descriere);
                    if(descriere.toUpperCase().includes(keywordsArr[i].toUpperCase()))
                    {
                        c1 = true;
                        console.log(c1);
                        break;
                    }
                }
            }
            console.log(c1);

            let c2;
            if (curs.getElementsByClassName('val-disponibil')[0].innerHTML === disponibil || disponibil === 'all') {
                c2 = true;
            }
            let c3 = false;
            let oreCurs = parseInt(curs.getElementsByClassName('val-ore')[0].innerHTML);
            switch (oreDorite) {
                case 'mic':
                    if (oreCurs < 20) {
                        c3 = true;
                    }
                    break;
                case 'mediu':
                    if (20 <= oreCurs && oreCurs < 40) {
                        c3 = true;
                    }
                    break;
                case 'max':
                    if (oreCurs >= 40) {
                        c3 = true;
                    }
                    break;
                default:
                    c3 = true;
                    break;
            }
            let c4;
            let pretCurs = curs.getElementsByClassName('val-pret')[0].innerHTML;
            if (pretRange >=  pretCurs) {
                c4 = true;
            }
            let c5;
            let catCurs = curs.getElementsByClassName('val-categorie')[0].innerHTML;
            if (categ == catCurs)
            {
                c5 = true;
            }
             if(categ == 'all'){
                 c5 = true;
             }
            // if (muzica != '---')
            //     c5 = (produs.getElementsByClassName('list-group-item')[1].getElementsByClassName('badge bg-secondary')[1].innerHTML == muzica);
            // else
            //     c5 = true;

            // let c6;
            // let nrlocuri = parseInt(produs.getElementsByClassName('list-group-item')[4].getElementsByClassName('locuridisp')[0].innerHTML);

            // if (nrlocuri >= locuri)
            //     c6 = true;
            // else
            //     c6 = false;

            // // console.log(c1 + ' ' + c2 + ' ' + c3 + ' ' + c4 + ' ' + c5 + ' ' + c6);

            // if (c1 && c2 && c3 && c4 && c5 && c6) {
            //     produs.style.display = 'block';
            //     c ++;
            // } 
            if (c1 && c2 && c3 && c4 && c5) {
                curs.style.display = 'block';
                c++;
            }
        }

        // if (c == 0)
        //     document.getElementById('noProductsMsg').style.display = 'block';
        // else
        //     document.getElementById('noProductsMsg').style.display = 'none';
    }

    document.getElementById('resetare').onclick = function () {
        let rBtns = document.getElementsByClassName('rBtn');
        for (let rBtn of rBtns) {
            rBtn.checked = false;
        }

        document.getElementById('inp-nume').value = '';
        let cursuri = document.getElementsByClassName('curs');
        for (let curs of cursuri) {
            curs.style.display = 'block';
        }
    };

    document.getElementById('inp-pret').onchange = function () {

        document.getElementById('valoarePret').value = document.getElementById('inp-pret').value;
    }
    function sortare(mod) {
        let curs = document.getElementsByClassName('curs');
        var v_curs = Array.from(curs);
        v_curs.sort(function (a, b) {
            let pret1 = parseFloat(a.getElementsByClassName("val-pret")[0].innerHTML);
            let pret2 = parseFloat(b.getElementsByClassName("val-pret")[0].innerHTML);
            if (pret1 == pret2) {
                let nume_a = a.getElementsByClassName("val-nume")[0].innerHTML;
                let nume_b = b.getElementsByClassName("val-nume")[0].innerHTML;
                return mod * nume_a.localeCompare(nume_b);
            }
            return mod * (pret1 - pret2);
        });
        for (let curs of v_curs) {
            curs.parentElement.appendChild(curs);
        }
    }

    document.getElementById("sortCrescNume").onclick = function () {
        sortare(1);
    };
    document.getElementById("sortDescrescNume").onclick = function () {
        sortare(-1);
    };

}