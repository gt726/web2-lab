const express = require("express");
const pool = require("../db/pool");
const QRCode = require("qrcode");

const { jwtCheck, requiredScopes } = require("../middleware/apiAuth");

const router = express.Router();

// dohvacanje propusnice
router.get(
    "/passes/:id",
    jwtCheck,
    requiredScopes("read:passes"),
    async (req, res) => {
        try {
            const result = await pool.query(
                "SELECT * FROM passes WHERE id = $1",
                [req.params.id],
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    error: "Propusnica nije pronađena.",
                });
            }

            const pass = result.rows[0];

            return res.json({
                id: pass.id,
                name: pass.name,
                document: pass.document,
                issuedAt: pass.issued_at,
                status: pass.status,
            });
        } catch (error) {
            console.error("Greška pri dohvaćanju propusnice:", error);

            return res.status(500).json({
                error: "Došlo je do pogreške na poslužitelju.",
            });
        }
    },
);

// kreiranje nove propusnice
router.post(
    "/passes",
    jwtCheck,
    requiredScopes("create:passes"),
    async (req, res) => {
        try {
            const { name, document } = req.body;

            // provjera podataka
            if (
                typeof name !== "string" ||
                typeof document !== "string" ||
                !name.trim() ||
                !document.trim()
            ) {
                return res.status(400).json({
                    error: "Ime i broj dokumenta su obavezni.",
                });
            }

            // spremanje propusnice u bazu
            const result = await pool.query(
                `INSERT INTO passes (name, document)
                 VALUES ($1, $2)
                 RETURNING id`,
                [name.trim(), document.trim()],
            );

            const passId = result.rows[0].id;

            // URL javne stranice propusnice
            const publicUrl = `${req.protocol}://${req.get("host")}/passes/info/${passId}`;

            // generiranje QR koda
            const qrBuffer = await QRCode.toBuffer(publicUrl, {
                type: "png",
            });

            // API URL u Location zaglavlju
            const apiUrl = `${req.protocol}://${req.get("host")}/passes/${passId}`;

            return res.status(201).location(apiUrl).type("png").send(qrBuffer);
        } catch (error) {
            console.log("Greška pri kreiranju propusnice: ", error);

            return res.status(500).json({
                error: "Došlo je do pogreške pri kreiranju propusnice.",
            });
        }
    },
);

module.exports = router;
