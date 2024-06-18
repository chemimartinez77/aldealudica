// src/pages/api/getGameDetails.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { parseString } from 'xml2js';

async function fetchGameDetails(gameId: string) {
    const detailsUrl = `https://boardgamegeek.com/xmlapi2/thing?id=${gameId}`;
    const response = await fetch(detailsUrl);
    const xml = await response.text();
  
    return new Promise((resolve, reject) => {
      parseString(xml, (err, result) => {
        if (err) {
          reject(err);
        } else {
          const gameDetails = result.items.item[0];
          const imageUrl = gameDetails && gameDetails.image ? gameDetails.image[0] : '';
          resolve(imageUrl);
        }
      });
    });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { gameId } = req.query;

    if (!gameId) {
        return res.status(400).json({ error: 'Missing gameId parameter' });
    }

    try {
        const imageUrl = await fetchGameDetails(gameId as string);
        res.status(200).json({ imageUrl });
    } catch (error) {
        console.error('Error fetching game details:', error);
        res.status(500).json({ error: 'Failed to fetch game details' });
    }
}
