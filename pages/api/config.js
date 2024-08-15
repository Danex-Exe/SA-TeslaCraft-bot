import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  const filePath = path.join(process.cwd(), 'app/data/config.json');

  if (req.method === 'GET') {
    try {
      const jsonData = fs.readFileSync(filePath, 'utf-8');
      const config = JSON.parse(jsonData);
      res.status(200).json(config);
    } catch (error) {
      res.status(500).json({ error: 'Не удалось прочитать конфиг' });
    }
  } else if (req.method === 'POST') {
    const newConfig = req.body;
    try {
      fs.writeFileSync(filePath, JSON.stringify(newConfig, null, 2), 'utf-8');
      res.status(200).json({ status: 'Успешно' });
    } catch (error) {
      res.status(500).json({ error: 'Не удалось сохранить конфиг' });
    }
  } else {
    res.status(405).end();
  }
}
