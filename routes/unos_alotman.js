var express = require('express');
var router = express.Router();
const mysql = require('mysql2')

var pool = mysql.createPool ({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    maxIdle: 10, // max idle connections, the default value is the same as `connectionLimit`
    idleTimeout: 60000, // idle connections timeout, in milliseconds, the default value 60000
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
})
router.get('/', function(req, res, next) {
    res.render('unos_alotman', { title: 'Express' });
});
router.post('/unesi-alotman', (req, res) => {
    const alotman_stavke = {
        dobavljacNaziv: req.body.dobavljac,
        periodPocetak: req.body.periodPocetak,
        periodZavrsetak: req.body.periodZavrsetak,
        napomena: req.body.napomena,
        vrstaSobeNaziv: req.body.vrstaSobe,
        kolicina: req.body.kolicina }
    console.log(alotman_stavke);

    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Greška pri povezivanju sa bazom:', err);
            return res.status(500).send('Došlo je do greške prilikom povezivanja sa bazom.');
        }

        connection.beginTransaction(err => {
            if (err) {
                connection.release();
                throw err;
            }

            // Dohvatanje ID-a za dobavljača
            const queryDobavljacId = `SELECT dobavljac_ID FROM PROJEKAT_dobavljac WHERE naziv_dobavljaca = ?`;
            connection.query(queryDobavljacId, [alotman_stavke.dobavljacNaziv], (err, dobavljacResults) => {
                if (err || dobavljacResults.length === 0) {
                    return connection.rollback(() => {
                        connection.release();
                        throw err || new Error('Dobavljač nije pronađen');
                    });
                }

                const dobavljacId = dobavljacResults[0].dobavljac_ID;
                console.log(dobavljacId);
                // Dohvatanje ID-a za vrstu sobe
                const queryVrstaSobeId = `SELECT vrsta_sobe_ID FROM PROJEKAT_vrsta_sobe WHERE opis = ?`;
                connection.query(queryVrstaSobeId, [alotman_stavke.vrstaSobeNaziv], (err, vrsteSobeResults) => {
                    if (err || vrsteSobeResults.length === 0) {
                        return connection.rollback(() => {
                            connection.release();
                            throw err || new Error('Vrsta sobe nije pronađena');
                        });
                    }

                    const vrstaSobeId = vrsteSobeResults[0].vrsta_sobe_ID;
                    // Unos u PROJEKAT_alotman
                    const status = 1;
                    const queryAlotman = `INSERT INTO PROJEKAT_alotmani (dobavljac_id, period_pocetak, period_zavrsetak, status,  napomena) VALUES (?, ?, ?, ?, ?)`;
                    connection.query(queryAlotman, [dobavljacId, alotman_stavke.periodPocetak, alotman_stavke.periodZavrsetak, status, alotman_stavke.napomena], (err, alotmanResults) => {
                        if (err) {
                            return connection.rollback(() => {
                                connection.release();
                                throw err;
                            });
                        }

                        const alotmanId = alotmanResults.insertId;

                        // Unos u PROJEKAT_alotman_stavke
                        const queryStavke = `INSERT INTO PROJEKAT_alotman_stavke (alotman_id, vrsta_sobe, kolicina) VALUES (?, ?, ?)`;
                        connection.query(queryStavke, [alotmanId, vrstaSobeId, alotman_stavke.kolicina], (err, _) => {
                            if (err) {
                                return connection.rollback(() => {
                                    connection.release();
                                    throw err;
                                });
                            }

                            connection.commit(err => {
                                if (err) {
                                    return connection.rollback(() => {
                                        connection.release();
                                        throw err;
                                    });
                                }
                                res.render('index')
                                connection.release();
                            });
                        });
                    });
                });
            });
        });
    });
});
router.get('/get_dobavljace', function(req, res, next) {
    pool.query('SELECT naziv_dobavljaca FROM PROJEKAT_dobavljac', (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});

router.get('/get_sobe', (req, res) => {
    pool.query('SELECT opis FROM PROJEKAT_vrsta_sobe', (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});
module.exports = router;
