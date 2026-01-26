require('dotenv').config();
async function listModels() {
    const API_KEY = process.env.VITE_GEMINI_API_KEY;
    const genAI = new GoogleGenerativeAI(API_KEY);

    try {
        console.log("Listing models...");
        // There is no direct listModels in the standard browser/node SDK easily accessible like this
        // But we can try to call a standard one.
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("test");
        console.log("Success with gemini-1.5-flash");
    } catch (error) {
        console.error("Error with gemini-1.5-flash:", error.message);
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-pro" });
            const result = await model.generateContent("test");
            console.log("Success with gemini-pro");
        } catch (e2) {
            console.error("Error with gemini-pro:", e2.message);
        }
    }
}

listModels();
