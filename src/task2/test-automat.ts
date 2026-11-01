
import "dotenv/config";
import { getToken, issuePass } from "./automat.js";

async function main() {
    const authority = process.env.ISSUER_BASE_URL;
    const audience = process.env.API_AUDIENCE;
    const clientId = process.env.M2M_CLIENT_ID;
    const clientSecret = process.env.M2M_CLIENT_SECRET;
    const scope = "create:passes";

    const url = "http://localhost:3000/passes";

    if (!authority || !audience || !clientId || !clientSecret) {
        throw new Error("Nedostaju potrebne Auth0 varijable u .env datoteci.");
    }

    console.log("1. Dohvaćanje pristupnog tokena...");

    const token = await getToken(
        authority,
        audience,
        clientId,
        clientSecret,
        scope
    );

    console.log("Token je uspješno dohvaćen.");

    console.log("2. Izdavanje propusnice...");

    await issuePass(
        url,
        token,
        "Testni Korisnik",
        "demo"
    );

    console.log("Propusnica je uspješno izdana.");
    console.log("PNG datoteka spremljena je u trenutni direktorij.");
}

main().catch((error: unknown) => {
    console.error("Greška pri testiranju:", error);

    if (error instanceof Error && error.cause) {
        console.error("Detalji uzroka:", error.cause);
    }

    process.exitCode = 1;
});
