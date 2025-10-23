
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== 'POST') {
    return response.status(405).json({ message: 'Method Not Allowed' });
  }

  const { imageBase64, lastMoves } = request.body;

  if (!imageBase64) {
    return response.status(400).json({ message: 'Missing imageBase64' });
  }

  try {
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-opus-20240229',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: `You are a world-class AI assistant for Klondike Solitaire. Your most important task is accuracy. An invalid move suggestion is a critical failure.

Analyze the provided game screenshot by following these steps methodically:
1. **Internal Analysis (Do not output this part):**
* First, identify every single face-up card in the seven Tableau columns. Note their suit, rank, and which column they are in.
* Second, identify the top card of each of the four Foundation piles.
* Third, identify the top card of the Waste pile (next to the Stockpile).
* Fourth, verify the game rules for each potential move:
- Tableau: Cards must be placed on a card of the next-highest rank and opposite color (e.g., Red 5 on Black 6).
- Foundations: Cards must be placed on a card of the same suit and next-lowest rank (e.g., 2 of Hearts on Ace of Hearts). Aces start new piles.
- Only Kings can move to empty Tableau columns.

2. **Strategic Move Selection:** Based on your internal analysis, determine the best sequence of moves. Use this strict priority order:
* **Priority 1 (Foundations):** Can any card from the Tableau or Waste pile be moved to a Foundation pile? Do this first.
* **Priority 2 (Reveal Cards):** Are there moves within the Tableau that will expose a new face-down card? This is the next highest priority.
* **Priority 3 (Consolidate Tableau):** Are there other valid moves within the Tableau that improve the board state, such as freeing a column for a King?
* **Priority 4 (Stockpile):** If and only if no other moves are possible or beneficial, suggest drawing from the stockpile.

3. **Final Output:**
* Your response MUST BE ONLY a numbered list of the moves you selected.
* CRITICAL: Before outputting, re-verify every single move against the image to ensure it is 100% valid and possible on the current board.
* Do not add any intro, outro, or commentary.
* If no moves are possible, respond with the exact text: "No moves available."

${lastMoves ? `\n\nThe previous suggestions were:\n${lastMoves}\n\nAnalyze the new board state and provide the next sequence of optimal moves based on the same strict rules and priorities.` : ''}`
            }
          ],
        }],
      }),
    });

    const data = await anthropicResponse.json();
    const text = data.content?.find((c: any) => c.type === 'text')?.text || '';

    response.status(200).json({ suggestion: text.trim() });
  } catch (error) {
    console.error('Error calling Anthropic API:', error);
    response.status(500).json({ message: 'Failed to communicate with the AI API.' });
  }
}
