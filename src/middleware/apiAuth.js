const { auth, requiredScopes } = require("express-oauth2-jwt-bearer");

const jwtCheck = auth({
    audience: process.env.API_AUDIENCE,
    issuerBaseURL: process.env.ISSUER_BASE_URL,
    tokenSigningAlg: "RS256",
});

module.exports = {
    jwtCheck,
    requiredScopes,
};
