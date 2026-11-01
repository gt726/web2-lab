const express = require("express");
const pool = require("../db/pool");
const QRCode = require("qrcode");
const { requiresAuth } = require("express-openid-connect");

const router = express.Router();

// ruta za kreiranje nove propusnice
router.post("/create", requiresAuth(), async (req, res) => {
    try {
        const { name, document } = req.body;

        if (!name || !document) {
            return res.status(400).send("Ime i broj dokumenta su obavezni.");
        }

        // spremi propusnicu u bazu
        const result = await pool.query(
            `INSERT INTO passes (name, document)
            VALUES ($1, $2)
            RETURNING id`,
            [name.trim(), document.trim()],
        );
        const passId = result.rows[0].id;
        res.redirect(`/passes/info/${passId}`);
    } catch (error) {
        console.error("Greška pri kreiranju propusnice: ", error);
        res.status(500).send("Došlo je do greške pri kreiranju propusnice.");
    }
});

// ruta za prikaz svih propusnica
router.get("/", requiresAuth(), async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM passes
            ORDER BY issued_at DESC`,
        );

        res.render("passes", {
            passes: result.rows,
        });
    } catch (error) {
        console.error("Greška pri dohvaćanju propusnica:", error);
        res.status(500).send("Došlo je do pogreške pri dohvaćanju propusnica.");
    }
});

// ruta za javni prikaz postojece propusnice
router.get("/info/:id", async (req, res) => {
    try {
        const id = req.params.id; // isto kao:  const { id } = req.params;

        const result = await pool.query("SELECT * FROM passes WHERE id = $1", [
            id,
        ]);

        // ako propusnica ne postoji
        if (result.rows.length === 0) {
            return res.status(404).send("Propusnica nije pronadena.");
        }

        // generiranje qr koda
        const passUrl = `${req.protocol}://${req.get("host")}/passes/info/${id}`;
        const qrCode = await QRCode.toDataURL(passUrl);

        // prikaz propusnice
        res.render("pass", {
            pass: result.rows[0],
            qrCode: qrCode,
        });
    } catch (error) {
        console.error("Greška pri dohvaćanju propusnice: ", error);
        res.status(500).send("Došlo je do greške pri dohvaćanju propusnice.");
    }
});

// ponistavanje propusnice
router.post("/:id/cancel", requiresAuth(), async (req, res) => {
    try {
        const id = req.params.id;
        const result = await pool.query(
            `UPDATE passes
            SET status = 'CANCELLED'
            WHERE id=$1
            RETURNING id`,
            [id],
        );

        if (result.rows.length === 0) {
            return res.status(404).send("Propusnica nije pronađena.");
        }

        res.redirect("/passes");
    } catch (error) {
        console.error("Greška pri poništavanju propusnice: ", error);
        res.status(500).send(
            "Došlo je do pogreške pri poništavanju propusnice.",
        );
    }
});

// brisanje propusnica
router.post("/:id/delete", requiresAuth(), async (req, res) => {
    try {
        const id = req.params.id;
        const result = await pool.query(
            `DELETE FROM passes
            WHERE id = $1
            RETURNING id`,
            [id],
        );

        if (result.rows.length === 0) {
            return res.status(404).send("Propusnica nije pronađena.");
        }

        res.redirect("/passes");
    } catch (error) {
        console.error("Greška pri brisanju propusnice:", error);
        res.status(500).send("Došlo je do pogreške pri brisanju propusnice.");
    }
});

module.exports = router;
