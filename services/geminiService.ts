import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Utility function to convert data URL to a Gemini Part object
const dataUrlToGeminiPart = (dataUrl: string) => {
    const parts = dataUrl.split(',');
    const mimeType = parts[0].match(/:(.*?);/)?.[1];
    const base64Data = parts[1];
    return {
        inlineData: {
            mimeType: mimeType || 'image/jpeg',
            data: base64Data,
        },
    };
};

export const getSolitaireMove = async (imageBase64: string, lastMoves: string): Promise<string> => {
  try {
    const imagePart = dataUrlToGeminiPart(imageBase64);

    let prompt = `You are a world-class AI assistant for Klondike Solitaire. Your most important task is accuracy. An invalid move suggestion is a critical failure.

Analyze the provided game screenshot by following these steps methodically:
1.  **Internal Analysis (Do not output this part):**
    *   First, identify every single face-up card in the seven Tableau columns. Note their suit, rank, and which column they are in.
    *   Second, identify the top card of each of the four Foundation piles.
    *   Third, identify the top card of the Waste pile (next to the Stockpile).
    *   Fourth, verify the game rules for each potential move:
        *   Tableau: Cards must be placed on a card of the next-highest rank and opposite color (e.g., Red 5 on Black 6).
        *   Foundations: Cards must be placed on a card of the same suit and next-lowest rank (e.g., 2 of Hearts on Ace of Hearts). Aces start new piles.
        *   Only Kings can move to empty Tableau columns.

2.  **Strategic Move Selection:** Based on your internal analysis, determine the best sequence of moves. Use this strict priority order:
    *   **Priority 1 (Foundations):** Can any card from the Tableau or Waste pile be moved to a Foundation pile? Do this first.
    *   **Priority 2 (Reveal Cards):** Are there moves within the Tableau that will expose a new face-down card? This is the next highest priority.
    *   **Priority 3 (Consolidate Tableau):** Are there other valid moves within the Tableau that improve the board state, such as freeing a column for a King?
    *   **Priority 4 (Stockpile):** If and only if no other moves are possible or beneficial, suggest drawing from the stockpile.

3.  **Final Output:**
    *   Your response MUST BE ONLY a numbered list of the moves you selected.
    *   CRITICAL: Before outputting, re-verify every single move against the image to ensure it is 100% valid and possible on the current board.
    *   Do not add any intro, outro, or commentary.
    *   If no moves are possible, respond with the exact text: "No moves available."`;


    if (lastMoves) {
        prompt += `\n\nThe previous suggestions were:\n${lastMoves}\n\nAnalyze the new board state and provide the next sequence of optimal moves based on the same strict rules and priorities.`;
    }
    
    const textPart = { text: prompt };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, textPart] },
    });
    
    return response.text.trim();

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to communicate with the Gemini API.");
  }
};