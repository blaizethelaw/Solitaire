
export const getSolitaireMove = async (imageBase64: string, lastMoves: string): Promise<string> => {
  try {
    const response = await fetch('/api/getSolitaireMove', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageBase64,
        lastMoves,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'The AI service failed to respond.');
    }

    const data = await response.json();
    return data.suggestion;
  } catch (error) {
    console.error('Error calling backend API:', error);
    throw new Error('Failed to communicate with the backend API.');
  }
};
