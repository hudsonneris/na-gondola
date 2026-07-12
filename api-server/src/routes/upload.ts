import { Router } from "express";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";
import * as Jimp from "jimp";

const router = Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../../../uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas'));
    }
  },
});

async function addTextToImage(
  imagePath: string,
  metadata: {
    storeName: string;
    storeCity: string;
    date: string;
    time: string;
    type: string;
  }
): Promise<string> {
  const outputPath = imagePath.replace(/\.[^.]+$/, '_watermarked.png');
  
  try {
    const image = await Jimp.read(imagePath);
    
    // Criar overlay preto na parte inferior
    const overlay = new Jimp(image.bitmap.width, 80, 0x000000AA);
    image.composite(overlay, 0, image.bitmap.height - 80);
    
    // Fonte para o texto
    const font = await Jimp.loadFont(Jimp.FONT_SANS_16_WHITE);
    const fontSmall = await Jimp.loadFont(Jimp.FONT_SANS_12_WHITE);
    
    // Adicionar textos
    const lines = [
      `📍 ${metadata.storeName} - ${metadata.storeCity}`,
      `📅 ${metadata.date} às ${metadata.time}`,
      `📷 ${metadata.type}`
    ];
    
    const padding = 8;
    const lineHeight = 24;
    
    lines.forEach((text, index) => {
      const y = image.bitmap.height - 75 + padding + index * lineHeight;
      const fontToUse = index === 0 ? font : fontSmall;
      image.print(fontToUse, padding + 5, y, text);
    });
    
    await image.writeAsync(outputPath);
    return outputPath;
  } catch (error) {
    console.error('Erro ao adicionar texto:', error);
    return imagePath;
  }
}

router.post("/visit-photo", upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    const { type, storeId, promoterName } = req.body;

    if (!file) {
      res.status(400).json({ error: "Nenhum arquivo enviado" });
      return;
    }

    if (!storeId) {
      res.status(400).json({ error: "Store ID é obrigatório" });
      return;
    }

    const storeResponse = await fetch(`http://localhost:3000/api/stores/${storeId}`);
    const storeData = await storeResponse.json();

    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR');
    const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const metadata = {
      storeName: storeData.name || 'Loja',
      storeCity: storeData.city || '',
      date: dateStr,
      time: timeStr,
      type: type === 'before' ? 'ANTES' : 'DEPOIS',
    };

    const imagePath = file.path;
    const watermarkedPath = await addTextToImage(imagePath, metadata);

    const filename = path.basename(watermarkedPath);
    const imageUrl = `/uploads/${filename}`;

    res.json({
      url: imageUrl,
      filename: filename,
      type,
      storeId,
      metadata,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error("Erro no upload:", error);
    res.status(500).json({ error: "Erro ao fazer upload", details: String(error) });
  }
});

export default router;
