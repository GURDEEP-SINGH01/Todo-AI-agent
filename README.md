# AI Todo Agent

An AI-powered Todo Assistant built using:

* Node.js
* Hugging Face Inference API
* Drizzle ORM
* PostgreSQL
* Agentic Tool Calling Pattern

This project demonstrates how to build a simple AI Agent that:

* Understands user intent using an LLM
* Decides which function/tool to call
* Interacts with a PostgreSQL database
* Uses PLAN → ACTION → OBSERVATION → OUTPUT workflow
* Maintains conversational interaction

---

# Features

## AI Agent Workflow

The assistant follows an agent loop:

1. User gives instruction
2. LLM creates a plan
3. LLM selects a tool/function
4. Backend executes the function
5. Observation is returned to the LLM
6. LLM generates final response

---

## Supported Actions

* Create todos
* Get all todos
* Search todos
* Delete todos
* Conversational interaction

---

# Tech Stack

| Technology              | Purpose         |
| ----------------------- | --------------- |
| Node.js                 | Backend runtime |
| Hugging Face Router API | LLM inference   |
| PostgreSQL              | Database        |
| Drizzle ORM             | Database ORM    |
| readline-sync           | CLI interaction |
| Axios                   | API calls       |

---

# Project Structure

```txt
.
├── drizzle/
├── src/
│   ├── db/
│   │   └── schema.js
│   └── index.js
├── .env
├── drizzle.config.js
├── index.js
├── package.json
└── README.md
```

---

# Database Schema

The project uses a simple Todo table.

```js
export const todosTable = pgTable("todos", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    todo: text().notNull(),
    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp('updated_at').$onUpdate(() => new Date()),
});
```

---

# Installation

## 1. Clone Repository

```bash
git clone https://github.com/GURDEEP-SINGH01/Todo-AI-agent
cd <project-folder>
```

---

## 2. Install Dependencies

```bash
npm install
```

---

## 3. Setup PostgreSQL

Make sure PostgreSQL is running locally.

Example database URL:

```env
DATABASE_URL=postgresql://admin:admin@localhost:5431/postgres
```

---

## 4. Create `.env`

```env
DATABASE_URL=postgresql://admin:admin@localhost:5431/postgres
HF_API_KEY=your_huggingface_api_key
```

---

# Hugging Face Setup

Create a Hugging Face account:

[https://huggingface.co/](https://huggingface.co/)

Generate API key:

[https://huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)

Add the token to `.env`.

---

# Run Database Migration

Generate migration:

```bash
npm run generate
```

Run migration:

```bash
npm run migrate
```

Optional Drizzle Studio:

```bash
npm run studio
```

---

# Running the Project

Start the AI agent:

```bash
node index.js
```

---

# Example Usage

## Create Todo

```txt
>> create a todo to buy groceries
```

Agent flow:

```txt
PLAN: I will create a todo
ACTION: createTodo
OBSERVATION: id returned
OUTPUT: Todo created successfully
```

---

## Get Todos

```txt
>> show all todos
```

Example output:

```txt
1. Buy groceries
2. Record YouTube video
```

---

## Delete Todo

```txt
>> delete my grocery todo
```

Agent flow:

1. Search matching todos
2. Identify todo
3. Delete todo
4. Return confirmation

---

# How The Agent Works

The project uses a basic agent architecture.

The LLM does NOT directly execute functions.

Instead:

1. LLM returns structured JSON
2. Backend reads JSON
3. Backend executes tool/function
4. Result is sent back to LLM
5. LLM continues reasoning

Example:

```json
{
  "steps": [
    {
      "type": "plan",
      "plan": "I will create a todo"
    },
    {
      "type": "action",
      "function": "createTodo",
      "input": "Buy milk"
    }
  ]
}
```

Backend executes:

```js
createTodo("Buy milk")
```

Observation returned:

```json
{
  "type": "observation",
  "observation": "Todo created with id 5"
}
```

---

# Available Tools

## createTodo(todo)

Creates a new todo.

---

## getAllTodos()

Returns all todos.

---

## searchTodo(query)

Searches matching todos.

---

## deleteTodoById(id)

Deletes todo using ID.

---

# Future Improvements

Possible upgrades:

* Add memory/history
* Multi-agent support
* Streaming responses
* Real weather API tools
* Voice assistant integration
* Web UI using React
* Authentication
* Vector database integration
* LangChain/LangGraph support
* OpenAI function calling

---

# Learning Goals

This project is useful for learning:

* AI Agents
* Tool Calling
* LLM orchestration
* Prompt engineering
* Function execution loops
* Database integration with AI
* Agent planning workflows

---

# Example Agent Loop

```txt
USER INPUT
   ↓
LLM PLAN
   ↓
TOOL SELECTION
   ↓
FUNCTION EXECUTION
   ↓
OBSERVATION
   ↓
LLM FINAL RESPONSE
```

---

# Notes

* Hugging Face free models may rate limit requests.
* Some smaller models may not follow JSON format perfectly.
* Better models improve agent reliability.

Recommended models:

* meta-llama/Llama-3.1-8B-Instruct
* Qwen/Qwen2.5-72B-Instruct
* mistralai/Mistral-7B-Instruct

---
