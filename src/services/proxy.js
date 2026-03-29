const axios = require("axios");

/**
 * Since this backend is deployed directly on the VPS,
 * requests made from here will use the VPS's IP (148.72.244.182).
 * IP to whitelist on wePAY and Peamsub: 148.72.244.182
 */
async function proxyRequest(targetUrl, method, headers, body) {
    try {
        console.log(`📡 [ProxyRequest] Direct request to ${method} ${targetUrl}`);

        const config = {
            method: method.toLowerCase(),
            url: targetUrl,
            headers: headers || {},
        };

        if (body) {
            config.data = typeof body === "object" ? body : JSON.parse(body);
        }

        const response = await axios(config);

        return {
            statusCode: response.status,
            data: response.data,
        };
    } catch (error) {
        const status = error.response?.status || 500;
        const data = error.response?.data || { message: error.message };
        console.error(`❌ [ProxyRequest] Failed:`, data);
        return {
            statusCode: status,
            data: data,
        };
    }
}

module.exports = { proxyRequest };
