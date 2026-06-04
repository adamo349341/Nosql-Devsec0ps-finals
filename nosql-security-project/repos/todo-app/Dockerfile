# Utiliser Node.js LTS comme image de base
FROM node:18-alpine

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de configuration
COPY package*.json ./

# Installer les dépendances
RUN npm install --only=production

# Copier le reste du code source
COPY . .

# Créer le dossier documents pour la persistance
RUN mkdir -p documents

# Exposer le port de l'application
EXPOSE 3000

# Définir l'utilisateur non-root pour la sécurité
USER node

# Commande pour démarrer l'application
CMD ["node", "server.js"]