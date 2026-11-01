
import { writeFile } from "node:fs/promises";

export async function getToken(
    authority: string,
    audience: string,
    clientId: string,
    clientSecret: string,
    scope: string
): Promise<string> {
    const tokenUrl = `${authority.replace(/\/+$/, "")}/oauth/token`;

    const response = await fetch(tokenUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
            grant_type: "client_credentials",
            client_id: clientId,
            client_secret: clientSecret,
            audience: audience,
            scope: scope,
        }),
    });

    if (!response.ok) {
        throw new Error(
            `Greška pri dohvaćanju tokena: HTTP ${response.status} ${response.statusText}`
        );
    }

    const data = await response.json();

    if (typeof data.access_token !== "string") {
        throw new Error(
            `Odgovor poslužitelja ne sadrži pristupni token. HTTP ${response.status}`
        );
    }

    return data.access_token;
}

export async function issuePass(
    url: string,
    token: string,
    name: string,
    document: string
): Promise<void> {
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            name: name,
            document: document,
        }),
    });

    if (!response.ok) {
        throw new Error(
            `Greška pri izdavanju propusnice: HTTP ${response.status} ${response.statusText}`
        );
    }

    const location = response.headers.get("Location");

    if (!location) {
        throw new Error(
            `Odgovor ne sadrži Location zaglavlje. HTTP ${response.status}`
        );
    }

    const passUrl = new URL(location, url);
    const passId = passUrl.pathname.split("/").filter(Boolean).pop();

    if (!passId) {
        throw new Error(
            `Nije moguće dohvatiti identifikator propusnice. HTTP ${response.status}`
        );
    }

    const imageBuffer = Buffer.from(await response.arrayBuffer());

    await writeFile(`${passId}.png`, imageBuffer);
}
