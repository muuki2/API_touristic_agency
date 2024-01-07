var express = require('express');
const mysql = require("mysql2");
var router = express.Router();
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
router.get('/', function(req, res, next) {

  pool.query(`SELECT * FROM PROJEKAT_usluga`, [], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.render('usluge', {results});
  });
});

router.get('/usluga_edit', function(req, res, next) {
    res.render('usluga_edit');
})
router.get('/usluga_edit/:id', function(req, res, next) {
  const uslugaId = req.params.id;

  pool.query('SELECT * FROM PROJEKAT_usluga WHERE usluga_ID = ?', [uslugaId], (err, result) => {
    if (err) {
      // Obrada greške
      return res.status(500).send('Došlo je do greške.');
    }

    // Ako je usluga pronađena, prosleđujemo je EJS template-u
    if (result.length > 0) {
      res.render('usluga_edit', { usluga: result[0] });
    } else {
      res.status(404).send('Usluga nije pronađena.');
    }
  });
})

router.post('/usluga_edit/:id', function (req, res, next) {
  const usluga_ID = req.params.id;
  const nova  = {
    naziv: req.body.naziv,
    Cijena: req.body.cijena
  }
  console.log(nova)
  const updateQuery = `UPDATE PROJEKAT_usluga SET naziv_usluge = ?, cijena = ? WHERE usluga_ID = ?`;

  pool.query(updateQuery, [nova.naziv, nova.Cijena, usluga_ID], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Došlo je do greške prilikom ažuriranja usluge.');
    }
    res.redirect('/usluge');
  });
})
router.delete('/usluga_delete/:id', function(req, res) {
  const uslugaId = req.params.id;
  console.log(uslugaId);
  // SQL upit za brisanje usluge iz baze podataka
  const deleteQuery = `DELETE FROM PROJEKAT_usluga WHERE usluga_ID = ?`;

  pool.query(deleteQuery, [uslugaId], (err, result) => {
    if (err) {
      // Obrada greške
      console.error(err);
      return res.status(500).send('Došlo je do greške prilikom brisanja usluge.');
    }

    // Obrada uspešnog brisanja
    res.status(200).send('Usluga je uspešno obrisana.');
  });
});
module.exports = router;
