// compare-envs.js
const fs = require("fs");
const dotenv = require("dotenv");
const axios = require("axios");

// CONFIGURA ESTOS VALORES
const VERCEL_TOKEN = "z0n1LMUEvaaML5c7ZWy4Lo2n";
const PROJECT_NAME = "aldealudica";
const TEAM_ID = ""; // si usas cuenta personal, déjalo vacío

async function main() {
    const envText = fs.readFileSync(".env.local", "utf8");
    const localVars = dotenv.parse(envText);

    const headers = {
        Authorization: `Bearer ${VERCEL_TOKEN}`,
    };

    const teamQuery = TEAM_ID ? `&teamId=${TEAM_ID}` : "";

    const response = await axios.get(
        `https://api.vercel.com/v10/projects/${PROJECT_NAME}/env${teamQuery}`,
        { headers }
    );

    const remoteVars = response.data.envs;

    const localKeys = Object.keys(localVars);
    const remoteKeys = remoteVars.map((v) => v.key);

    console.log("\n🔍 Comparando variables de entorno:\n");

    localKeys.forEach((key) => {
        if (remoteKeys.includes(key)) {
            console.log(`✅ ${key} está en Vercel`);
        } else {
            console.warn(`⚠️  ${key} NO está en Vercel`);
        }
    });

    const extraRemote = remoteKeys.filter((key) => !localKeys.includes(key));
    if (extraRemote.length > 0) {
        console.log("\n🛑 Variables en Vercel que no están en .env.local:");
        extraRemote.forEach((key) => console.log(`- ${key}`));
    }

    console.log("\n✅ Comparación finalizada.\n");
}

main().catch((err) => {
    console.error("Error:", err.response?.data || err.message);
});
