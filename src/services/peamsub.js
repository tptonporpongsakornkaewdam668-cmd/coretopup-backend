const { proxyRequest } = require("./proxy");

const PEAMSUB_API_BASE_URL = "https://api.peamsub24hr.com";
const PEAMSUB_API_KEY = process.env.PEAMSUB_API_KEY;

/**
 * Proxy Request to Peamsub API (via VPS)
 */
async function peamsubRequest(endpoint, method = "GET", body = null) {
    const base64Key = Buffer.from(PEAMSUB_API_KEY).toString("base64");
    const targetUrl = `${PEAMSUB_API_BASE_URL}${endpoint}`;
    const headers = {
        "Authorization": `Basic ${base64Key}`,
        "Content-Type": "application/json",
    };

    return proxyRequest(targetUrl, method.toUpperCase(), headers, body);
}

/**
 * Proxy Request to IndexGame API (via Peamsub)
 */
async function indexGameRequest(endpoint, method = "GET", body = null) {
    // IndexGame usually uses peamsub as a middleman or directly. 
    // Based on Baimonshop code, it seems they have a specific endpoint or logic.
    // We'll use the same proxy logic for now.
    return peamsubRequest(endpoint, method, body);
}

module.exports = {
    peamsubRequest,
    indexGameRequest,
};
