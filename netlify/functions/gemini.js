import { GoogleGenerativeAI } from "@google/generative-ai";

export const handler = async (event, context) => {
    // Hanya izinkan metode POST
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    // Ambil kunci API normal (GEMINI_API_KEY_1 sampai GEMINI_API_KEY_4)
    let normalKeys = Object.keys(process.env)
        .filter(key => key.startsWith("GEMINI_API_KEY_") && key !== "GEMINI_API_KEY_ULTIMATE_FALLBACK")
        .sort()
        .map(key => process.env[key])
        .filter(value => !!value);

    // Acak urutan kunci normal agar beban terbagi rata
    normalKeys = normalKeys.sort(() => Math.random() - 0.5);

    // Ambil kunci fallback terakhir
    const ultimateFallbackKey = process.env.GEMINI_API_KEY_ULTIMATE_FALLBACK;

    // Gabungkan: kunci normal yang diacak + kunci fallback di akhir
    let apiKeys = [...normalKeys];
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
            // Jika error adalah 400 (Bad Request - prompt issue), tidak perlu rotasi kunci karena akan tetap gagal
            const statusCode = error.status || (error.response ? error.response.status : 500);

            if (statusCode === 400) {
                break; // Keluar dari loop jika input user yang salah
            }

            // Lanjut ke iterasi berikutnya untuk mencoba kunci lain
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

