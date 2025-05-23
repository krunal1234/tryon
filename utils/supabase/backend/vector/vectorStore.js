import OpenAI from "openai";
import { createClient } from "../../server";
import cheerio from 'cheerio';   // Make sure cheerio is also imported
import axios from "axios";
import cheerioModule from "cheerio";

const vectorStore = {
    addItem: async (textContent) => {
        const supabase = await createClient();
        const combinedText = textContent.join(' '); // Combine text for token counting
        const embedding = await vectorStore.embedContent(combinedText);

        const { data, error } = await supabase
            .from('vectors')
            .insert([{ vector: embedding }]);

        if (error) {
            console.error("Error inserting data:", error);
            throw error;
        }

        return data;
    },

    embedContent: async (text) => {
        const api = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        const response = await api.embeddings.create({
            model: 'text-embedding-ada-002',
            input: text,
        });
        return response.data[0].embedding;
    },

    crawlAndIndex: async (url) => {
        const { data } = await axios.get(url);
        const $ = cheerioModule.load(data);
        $('iframe, script').remove();
        const scrapedData = [];

        $('body *').each((i, element) => {
            const text = $(element).text().trim();
            if (text) {
                scrapedData.push(text.replace(/\s{2,}/g, ' '));
            }
        });

        const result = await vectorStore.addItem(scrapedData);

        return result;
    }
};

export default vectorStore;
