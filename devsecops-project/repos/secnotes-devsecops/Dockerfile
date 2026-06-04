FROM node:20

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

# V7 - exécution en root, pas de multi-stage build, pas de user non privilégié
CMD ["npm", "start"]
