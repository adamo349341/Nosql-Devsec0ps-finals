# Fichier: Dockerfile
# Recette pour créer une image Docker de notre application

# ÉTAPE 1: Partir d'une image Node.js de base
FROM node:v22.20.0

# ÉTAPE 2: Définir le répertoire de travail
WORKDIR /app

# ÉTAPE 3: Copier les fichiers de dépendances
COPY package*.json ./

# ÉTAPE 4: Installer les dépendances
RUN npm install --production

# ÉTAPE 5: Copier le reste du code
COPY .  .

# ÉTAPE 6: Exposer le port 3000
EXPOSE 3000

# ÉTAPE 7: Définir la commande pour démarrer l'application
CMD ["node", "app.js"]
