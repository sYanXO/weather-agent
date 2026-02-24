import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

async function fetchWeather(city: string) {
    try {
        // Geocoding
        const geoUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`;
        const geoRes = await fetch(geoUrl, { headers: { 'User-Agent': 'WeatherAgentNextJS/1.0' } });
        const geoData = await geoRes.json();

        if (!geoData || geoData.length === 0) return `Could not find coordinates for ${city}.`;
        
        const { lat, lon, display_name } = geoData[0];

        // Weather
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
        const weatherRes = await fetch(weatherUrl);
        const weatherData = await weatherRes.json();
        
        return JSON.stringify({
            location: display_name,
            temp: weatherData.current_weather.temperature + "°C",
            wind: weatherData.current_weather.windspeed + " km/h"
        });
    } catch (err) {
        console.error("Error fetching weather:", err);
        return "Error fetching data.";
    }
}

export async function POST(req: Request) {
    if (!process.env.GEMINI_API_KEY) {
        return NextResponse.json({ error: "Gemini API key is not configured inside .env" }, { status: 500 });
    }

    try {
        const { message } = await req.json();

        if (!message) {
            return NextResponse.json({ error: "Message is required" }, { status: 400 });
        }

        // City extraction
        const extract = await model.generateContent(`Identify the city name in this text: "${message}". Respond with ONLY the city name. If no city is mentioned, respond with 'none'.`);
        const city = extract.response.text().trim().toLowerCase();

        if (city !== 'none') {
            const data = await fetchWeather(city);
            const final = await model.generateContent(`User asked: "${message}". We found this weather data: ${data}. Please provide a friendly and natural response incorporating this data.`);
            
            return NextResponse.json({ 
                response: final.response.text(),
                metadata: { city, weatherData: data }
            });
        } else {
            // General conversation
            const result = await model.generateContent(message);
            return NextResponse.json({ 
                response: result.response.text() 
            });
        }
    } catch (error) {
        console.error("Error processing chat:", error);
        return NextResponse.json({ error: "Failed to process message" }, { status: 500 });
    }
}
