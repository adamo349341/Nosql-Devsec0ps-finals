// MongoDB init script — seeds initial data
db = db.getSiblingDB('taskdb');

db.createCollection('tasks');

db.tasks.insertMany([
  {
    title: "Setup project repository",
    description: "Initialize Git repo and push to GitLab",
    status: "done",
    priority: "high",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: "Configure CI/CD pipeline",
    description: "Setup .gitlab-ci.yml with all stages",
    status: "in-progress",
    priority: "high",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: "Write unit tests",
    description: "Cover all API endpoints with Jest",
    status: "todo",
    priority: "medium",
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

print('✅ Database seeded successfully');
