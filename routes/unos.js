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
/* GET users listing. */
router.get('/', function(req, res, next) {
    res.render('unos');
});

router.post('/ruta_za_izvjestaj', function (req,res, next) {
    const datum = {
        datum_od1: req.body.datum_od1,
        datum_do1: req.body.datum_do1,
        datum_od2: req.body.datum_od2,
        datum_do2: req.body.datum_do2
    };
    pool.query(`CALL 4_1e_uporedni_izvjestaj(?, ?, ?, ?)`, [datum.datum_od1, datum.datum_do1, datum.datum_od2, datum.datum_do2], (err, results) => {
        if (err) {
            console.error('Greška pri konekciji ili izvršavanju upita:', err);
            return res.status(500).send('Došlo je do greške prilikom povezivanja sa bazom podataka.');
        }
        res.render('stranica_sa_izvjestajem', { podaci: results[0] });
    });
});

module.exports = router;
