# Task Manager API

REST API Node.js + MongoDB avec pipeline GitLab CI/CD complet.

## Stack
- **Node.js 20** + Express
- **MongoDB 7** + Mongoose
- **Docker** multi-stage
- **GitLab CI/CD** — 5 stages

## Lancer en local

```bash
# Avec Docker Compose (recommandé)
docker-compose up --build

# Sans Docker
npm install
npm run dev   # nécessite MongoDB local
```

## API Endpoints

| Method | URL | Description |
|--------|-----|-------------|
| GET | /health | Health check |
| GET | /api/tasks | Toutes les tâches |
| GET | /api/tasks/:id | Une tâche |
| POST | /api/tasks | Créer une tâche |
| PUT | /api/tasks/:id | Modifier une tâche |
| DELETE | /api/tasks/:id | Supprimer une tâche |

### Exemple POST /api/tasks
```json
{
  "title": "Ma tâche",
  "description": "Description optionnelle",
  "priority": "high",
  "status": "todo"
}
```

## Pipeline GitLab CI/CD

| Stage | Job | Description |
|-------|-----|-------------|
| build | build-job | `npm ci` |
| test | test-job | Jest + coverage |
| security | security-dependencies-scan | `npm audit` |
| security | security-secrets-scan | TruffleHog (allow_failure) |
| build-image | build-image | Docker build + push |
| deploy-staging | deploy-staging | SSH deploy |

## Variables GitLab à configurer

Dans **Settings → CI/CD → Variables** :

| Variable | Description |
|----------|-------------|
| `CI_REGISTRY_USER` | Automatique GitLab |
| `CI_REGISTRY_PASSWORD` | Automatique GitLab |
| `STAGING_SSH_PRIVATE_KEY` | Clé SSH privée du serveur |
| `STAGING_HOST` | IP/domaine du serveur staging |
| `STAGING_USER` | Utilisateur SSH |
| `STAGING_MONGO_URI` | URI MongoDB staging |
