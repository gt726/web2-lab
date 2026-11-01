const express = require("express");
const path = require("path");
require("dotenv").config();

const { auth } = require("express-openid-connect");

const pool = require("./db/pool");
const passesRouter = require("./routes/passes");
const apiRouter = require("./routes/api");

const app = express();
app.use(express.static(path.join(__dirname, "../public")));

app.use(
    auth({
        authRequired: false,
        auth0Logout: true,
        secret: process.env.SESSION_SECRET,
        baseURL: process.env.BASE_URL,
        clientID: process.env.CLIENT_ID,
        issuerBaseURL: process.env.ISSUER_BASE_URL,
    }),
);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../views"));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/passes", passesRouter);
app.use("/", apiRouter);

app.get("/", async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status = 'ACTIVE')::int AS active
      FROM passes
    `);

        res.render("index", {
            title: "Digitalne propusnice",
            totalPasses: result.rows[0].total,
            activePasses: result.rows[0].active,
            isAuthenticated: req.oidc.isAuthenticated(),
            user: req.oidc.user,
        });
    } catch (error) {
        console.error("Greška pri dohvaćanju propusnica:", error);

        res.status(500).send("Došlo je do pogreške pri dohvaćanju podataka.");
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Aplikacija radi na portu ${PORT}`);
});
