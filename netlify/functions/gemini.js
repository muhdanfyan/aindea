import { GoogleGenerativeAI } from "@google/generative-ai";

export const handler = async (event, context) => {
    // Hanya izinkan metode POST
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    // Ambil kunci secara berurutan (GEMINI_API_KEY_1, GEMINI_API_KEY_2, dst)
    let apiKeys = Object.keys(process.env)
        .filter(key => key.startsWith("GEMINI_API_KEY_") && key !== "GEMINI_API_KEY_ULTIMATE_FALLBACK")
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
        .map(key => process.env[key])
        .filter(value => !!value);

    // Ambil kunci fallback terakhir jika ada
    const ultimateFallbackKey = process.env.GEMINI_API_KEY_ULTIMATE_FALLBACK;
    if (ultimateFallbackKey && !apiKeys.includes(ultimateFallbackKey)) {
        apiKeys.push(ultimateFallbackKey);
    }

    // Tambahkan kunci default lama jika ada (untuk backward compatibility)
    if (process.env.GEMINI_API_KEY && !apiKeys.includes(process.env.GEMINI_API_KEY)) {
        apiKeys.unshift(process.env.GEMINI_API_KEY);
    }

    if (apiKeys.length === 0) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "No Gemini API keys found in environment variables" }),
        };
    }


    const { model: modelName, prompt } = JSON.parse(event.body);
    let lastError = null;

    // Coba setiap kunci API satu per satu jika terjadi kesalahan retryable
    for (let i = 0; i < apiKeys.length; i++) {
        const apiKey = apiKeys[i];
        try {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: modelName || "gemini-2.0-flash" });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            return {
                statusCode: 200,
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ text }),
            };
        } catch (error) {
            console.error(`Attempt ${i + 1} with key ending in ...${apiKey.slice(-4)} failed:`, error.message);
            lastError = error;

            // Jika error adalah 403 (Forbidden/Leaked) atau error server, lanjut ke kunci berikutnya
            // Jika error adalah 400 (Bad Request), cek apakah karena API key atau input user
            const statusCode = error.status || (error.response ? error.response.status : 500);
            const errorMessage = error.message || "";

            if (statusCode === 400 && !errorMessage.toLowerCase().includes("api key")) {
                break; // Keluar dari loop jika input user yang salah (Prompt issue)
            }

            // Lanjut ke iterasi berikutnya untuk mencoba kunci lain jika itu masalah API key
        }
    }

    return {
        statusCode: lastError?.status || 500,
        body: JSON.stringify({
            error: lastError?.message || "All API keys failed",
            details: "Please try again later or check API key status."
        }),
    };
};

