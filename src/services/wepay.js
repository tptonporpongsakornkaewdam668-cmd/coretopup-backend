const { proxyRequest } = require("./proxy");
const crypto = require("crypto");

const WEPAY_API_URL = "https://www.wepay.in.th/client_api.json.php";
const WEPAY_USERNAME = process.env.WEPAY_USERNAME;
const WEPAY_PASSWORD = process.env.WEPAY_PASSWORD;
const WEPAY_CALLBACK_URL = process.env.WEPAY_CALLBACK_URL;

const md5 = (str) => crypto.createHash("md5").update(str).digest("hex");

/**
 * Proxy Request to wePAY API (via VPS)
 */
async function wepayRequest(payload) {
    const password_hash = md5(WEPAY_PASSWORD);
    const body = {
        username: WEPAY_USERNAME,
        password_hash,
        ...payload
    };

    const headers = { "Content-Type": "application/json" };
    return proxyRequest(WEPAY_API_URL, "POST", headers, body);
}

/**
 * Fetch the full product list from wePAY (via VPS)
 */
async function getWepayProductList() {
    return proxyRequest("https://www.wepay.in.th/comp_export.php?json", "GET", {}, null);
}

module.exports = {
    wepayRequest,
    getWepayProductList
};
