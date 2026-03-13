const axios = require("axios");

const VPS_PROXY_URL = "http://157.85.102.141:3002/proxy";

/**
 * Helper to route requests through VPS Proxy if needed
 */
async function proxyRequest(targetUrl, method, headers, body) {
    try {
        console.log(`📡 [ProxyRequest] Forwarding ${method} ${targetUrl} via VPS...`);

        const proxyPayload = {
            targetUrl,
            method,
            headers,
        };

        if (body) {
            proxyPayload.body = typeof body === 'object' ? JSON.stringify(body) : body;
        }

        const response = await axios.post(VPS_PROXY_URL, proxyPayload);

        return {
            statusCode: response.status,
            data: response.data
        };
    } catch (error) {
        const status = error.response?.status || 500;
        const data = error.response?.data || { message: error.message };
        console.error(`❌ [ProxyRequest] Failed:`, data);
        return {
            statusCode: status,
            data: data
        };
    }
}

module.exports = { proxyRequest };
