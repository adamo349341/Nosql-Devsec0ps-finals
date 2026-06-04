const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));


if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}


const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB max
});


function getFileCount() {
  const files = fs.readdirSync('uploads');
  return files.length;
}

module.exports = {
  app,
  getFileCount
};



app.post('/upload', upload.single('file'), (req, res) => {
  res.json({ message: 'File uploaded successfully' });
});


app.get('/files', (req, res) => {
  fs.readdir('uploads', (err, files) => {
    if (err) return res.status(500).json([]);
    res.json(files);
  });
});


app.delete('/delete/:name', (req, res) => {
  const filePath = path.join(__dirname, 'uploads', req.params.name);

  fs.unlink(filePath, (err) => {
    if (err) return res.status(404).json({ error: 'File not found' });
    res.json({ message: 'File deleted' });
  });
});

// Compter les fichiers
app.get('/count', (req, res) => {
  res.json({ count: getFileCount() });
});

// Lancer seulement si exécuté directement
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

