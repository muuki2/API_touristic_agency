var express = require('express');
var router = express.Router();
const mysql = require("mysql2");
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
/* GET home page. */
router.get('/:id', function(req, res, next) {
  const rezervacijaId = req.params.id;

  // SQL upit za dohvatanje podataka o rezervaciji
  const queryZaglavlje = 'SELECT r.rezervacija_ID, r.datum_rezervacije, k.ime_kupca, r.alotman_ID\n' +
      'FROM PROJEKAT_rezervacija r\n' +
      'JOIN PROJEKAT_kupci k ON r.kupac_ID = k.kupac_ID\n' +
      'WHERE r.rezervacija_ID = ?';
  const queryStavke = 'SELECT s.stavke_ID, u.naziv_usluge, s.datum_od, s.datum_do, s.broj_komada, s.cijena, v.broj_odraslih, v.broj_djece\n' +
      'FROM PROJEKAT_stavke s\n' +
      'JOIN PROJEKAT_usluga u ON s.usluga_ID = u.usluga_ID\n' +
      'JOIN PROJEKAT_vrsta_smjestaja v ON s.vrsta_smjestaja_ID = v.vrsta_smjestaja_ID\n' +
      'WHERE s.rezervacija_ID = ?';

  // Prvo dohvatamo zaglavlje rezervacije
  pool.query(queryZaglavlje, [rezervacijaId], (err, zaglavlje) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Došlo je do greške prilikom dohvatanja rezervacije.');
    }

    // Zatim dohvatamo stavke rezervacije
    pool.query(queryStavke, [rezervacijaId], (err, stavke) => {
      if (err) {
        console.error(err);
        return res.status(500).send('Došlo je do greške prilikom dohvatanja stavki rezervacije.');
      }

      // Slanje odgovora sa podacima o rezervaciji
      // res.json({
      //   rezervacija: zaglavlje[0],
      //   stavke: stavke
      // })
      res.render('odaberi', {rezervacija: zaglavlje[0], stavke: stavke})

    });
  });
});

module.exports = router;
