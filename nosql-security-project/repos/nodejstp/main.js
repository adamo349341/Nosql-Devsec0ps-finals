const express = require("express")
const fs = require("fs/promises")
const path = require("path")
const { exec } = require("child_process")

const app = express()
const PORT = 4000
const TODOS_PATH = path.join(__dirname, "todos.json")

app.use(express.json())
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type")
  next()
})

async function readTodos() {
  try {
    const data = await fs.readFile(TODOS_PATH, "utf8")
    return JSON.parse(data)
  } catch {
    return []
  }
}

async function writeTodos(todos) {
  await fs.writeFile(TODOS_PATH, JSON.stringify(todos, null, 2), "utf8")
}

app.get("/todos", async (req, res) => {
  const todos = await readTodos()
  res.json({ todos })
})

app.get("/todos/:id", async (req, res) => {
  const todos = await readTodos()
  const todo = todos.find(t => String(t.id) === req.params.id)
  if (!todo) return res.status(404).send("todo not found")
  res.json(todo)
})

app.post("/todos", async (req, res) => {
  const todos = await readTodos()
  const newId = todos.length
    ? (Math.max(...todos.map(t => Number(t.id) || 0)) + 1).toString()
    : "1"
  const newTodo = { id: newId, ...req.body }
  todos.push(newTodo)
  await writeTodos(todos)
  res.status(201).json(newTodo)
})

app.delete("/todos/:id", async (req, res) => {
  const todos = await readTodos()
  const index = todos.findIndex(t => String(t.id) === req.params.id)
  if (index === -1) return res.status(404).json({ error: "not found" })
  const [deleted] = todos.splice(index, 1)
  await writeTodos(todos)
  res.json(deleted)
})

app.listen(PORT, () => {
  const url = `http://localhost:${PORT}/todos`
  try {
    if (process.platform === "win32") exec(`start "" "${url}"`)
    else if (process.platform === "darwin") exec(`open "${url}"`)
    else exec(`xdg-open "${url}"`)
  } catch {}
})
