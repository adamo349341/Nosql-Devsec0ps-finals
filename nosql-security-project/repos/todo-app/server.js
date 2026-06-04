const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Stockage en mémoire
const documents = {};
const users = new Map();

// Créer le dossier documents
const docsDir = path.join(__dirname, 'documents');
(async () => {
  await fs.mkdir(docsDir, { recursive: true });
})();

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, 'public')));

// Route API pour les documents
app.get('/api/docs/:id', async (req, res) => {
  const docId = req.params.id;
  try {
    const filePath = path.join(docsDir, `${docId}.md`);
    let content = '# New Document\n\nStart typing here...';
    
    try {
      content = await fs.readFile(filePath, 'utf8');
    } catch {
      await fs.writeFile(filePath, content);
    }
    
    res.json({ id: docId, content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Sauvegarde périodique
setInterval(async () => {
  for (const [docId, content] of Object.entries(documents)) {
    try {
      await fs.writeFile(path.join(docsDir, `${docId}.md`), content, 'utf8');
    } catch (err) {
      console.error('Error saving:', err);
    }
  }
}, 30000);

// WebSocket
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join-document', ({ docId, userName }) => {
    if (!documents[docId]) {
      documents[docId] = '# New Document\n\nStart typing here...';
    }
    
    users.set(socket.id, {
      name: userName || `User${socket.id.substring(0, 4)}`,
      docId,
      cursor: 0
    });
    
    socket.join(docId);
    
    socket.emit('document-content', {
      content: documents[docId],
      users: Array.from(users.values())
        .filter(u => u.docId === docId)
        .map(u => ({ name: u.name, cursor: u.cursor }))
    });
    
    socket.to(docId).emit('user-joined', {
      userId: socket.id,
      name: users.get(socket.id).name
    });
  });
  
  socket.on('text-change', ({ docId, changes, cursorPos }) => {
    if (!documents[docId]) return;
    
    let doc = documents[docId];
    
    if (changes.type === 'insert') {
      const before = doc.substring(0, changes.position);
      const after = doc.substring(changes.position);
      doc = before + changes.text + after;
    } else if (changes.type === 'delete') {
      const before = doc.substring(0, changes.position);
      const after = doc.substring(changes.position + changes.length);
      doc = before + after;
    }
    
    documents[docId] = doc;
    
    const user = users.get(socket.id);
    if (user && user.docId === docId) {
      user.cursor = cursorPos;
    }
    
    socket.to(docId).emit('text-update', {
      userId: socket.id,
      changes,
      cursorPos,
      userName: user?.name
    });
    
    const docUsers = Array.from(users.values())
      .filter(u => u.docId === docId)
      .map(u => ({ id: socket.id, name: u.name, cursor: u.cursor }));
    
    io.to(docId).emit('users-update', docUsers);
  });
  
  socket.on('cursor-move', ({ docId, cursorPos }) => {
    const user = users.get(socket.id);
    if (user && user.docId === docId) {
      user.cursor = cursorPos;
      socket.to(docId).emit('cursor-update', {
        userId: socket.id,
        cursorPos,
        userName: user.name
      });
    }
  });
  
  socket.on('disconnect', () => {
    const user = users.get(socket.id);
    if (user) {
      socket.to(user.docId).emit('user-left', {
        userId: socket.id,
        name: user.name
      });
      users.delete(socket.id);
    }
  });
});
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Application running' });
});

// Démarrer le serveur
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server: http://localhost:${PORT}`);
});