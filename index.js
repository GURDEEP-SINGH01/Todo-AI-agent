import axios from "axios";
import { todosTable } from "./src/db/schema.js";
import { db } from "./src/index.js";
import { ilike, eq } from "drizzle-orm";
import readlineSync from "readline-sync"

//tools
async function getAllTodos() {
    const todos = await db.select().from(todosTable);

    return todos.map((todo, index) => {
        return `${index + 1}. ${todo.todo}`;
    }).join("\n");
}

async function createTodo(todo) {
    const [res] = await db
        .insert(todosTable)
        .values({
            todo,
        }).returning({
            id: todosTable.id
        });
    return res.id;
}

async function searchTodo(search) {
    const pattern = search.includes("%") ? search : `%${search}%`;
    const todo = await db
        .select()
        .from(todosTable)
        .where(ilike(todosTable.todo, pattern));
    return todo;
}

async function deleteTodoById(id) {
    const todo = await db
        .delete(todosTable)
        .where(eq(todosTable.id, id));
}

const API_URL = "https://router.huggingface.co/v1/chat/completions";

async function callModel(input) {
    try {
        const response = await axios.post(
            API_URL,
            {
                model: "meta-llama/Llama-3.1-8B-Instruct", // or "Qwen/Qwen2.5-72B-Instruct"
                messages: input,
                max_tokens: 500,
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.HF_API_KEY}`,
                    "Content-Type": "application/json",
                },
            }
        );


        return response.data.choices[0].message.content;
    } catch (err) {
        return "Error calling AI model";
    }
}

const tools = {
    "createTodo": createTodo,
    "getAllTodos": getAllTodos,
    "searchTodo": searchTodo,
    "deleteTodoById": deleteTodoById,
}

const SYSTEM_PROMPT = `
    You are AI todo list Assistant with START, PLAN,ACTION, Observation and Output state.
    Wait for the iser prompt and first PLAN using available tools.
    After planning take the action with appropritate tools and wait for Observation based on Action.
    Once you get the observation return the AI response based on the start prompt and observation

    you can manage tasks by adding, viewing, updating and deleting them 
    you must strictly follow JSON output format 

    IMPORTANT:
    - Do NOT use tools for casual conversation
    - Do NOT create todos unless explicitly asked
    - Do NOT assume user wants database actions
    - Return ONLY ONE valid JSON object
    - Never return separate JSON objects
    - ONLY generate:
        - plan
        - action
        - output
        - ALWAYS wrap them inside:
        {
            "steps": []
        }
    - ONLY use tools when user explicitly asks to:
        - create
        - add
        - delete
        - search
        - show
        - update todos
    - Return JSON in this format:
    Example:-
        {
        "steps": [
            {
            "type": "plan",
            "plan": "..."
            },
            {
            "type": "action",
            "function": "createTodo",
            "input": "Buy milk"
            }
        ]
        }

        OR

        {
        "steps": [
            {
            "type": "output",
            "output": "Todo created"
            }
        ]
        }


    todo db schema:
    id: integer primary key,
    todo: string,
    created_at: date time,
    updated_at: date time,
    
    Available Tools:
    getAllTodos(): Return all todos from database. ALWAYS call this when user asks to list, show, or view todos. NEVER assume there are no todos.
    createTodo(todo: string): creates new todo in the db and take todos as a string and return id of the created to
    searchTodo(query: string): searches todos using a keyword (e.g. "toothbrush", not full sentences). Always extract just the core keyword from user input.
    deleteTodoById(id: string): deleted the todo by id given in the db

    Example: 
    START
    {"type":"user","user":"Add a task for shopping groceries"}
    {"type":"plan","plan":"I will try to get more context on what user needs to shop."}
    {"type":"output","output":"Can u tell me what all items you wnat to shop for?"}
    {"type":"user","user":"I want to shop for eggs, veggies and carrot"}
    {"type":"plan","plan":"I will use createTodo to create a new TODO in DB."}
    {"type":"action","function":"createTodo","input":"Shopping for eggs, veggies and carrot"}
    {"type":"observation","observation":"2"}
    {"type":"output","output":"your todo has been created successfull"}

    Example:
    {"type":"user","user":"Delete a todo"}
    {"type":"plan","plan":"I will try to get more context on the delte todo"}
    {"type":"output","output":"Can u tell me what all items you wnat to shop for?"}
    {"type":"user","user":"delete todo where i want buy eggs and different stuff"}
    {"type":"plan","plan":"I will use searchTodo to find the todo that has the same type of stuff"}
    {"type":"action","function":"searchTodo","input":"eggs"}
    {"type":"observation","observation":"3"}
    {"type":"plan","output":"i will try to delete the to with id"}
    {"type":"action","function":"deleteTodoById","input":"delete the todo witht he given id"}
    {"type":"output","output":"the todo is deleted successfully"}


`
const messages = [{ role: 'system', content: SYSTEM_PROMPT }];

while (true) {
    const query = readlineSync.question(">> ");
    const userMessage = {
        type: 'user',
        user: query
    }
    messages.push({ role: 'user', content: JSON.stringify(userMessage) });
    while (true) {
        const result = await callModel(messages);
        messages.push({ role: 'assistant', content: result });

        var parsed;
        try {

            const cleaned = result
                .replace(/```json/g, "")
                .replace(/```/g, "")
                .trim();

            parsed = JSON.parse(cleaned);

        } catch (err) {

            console.log("Invalid JSON");
            break;
        }
        let shouldBreak = false; // ✅ Fix 2: Track whether output was reached

        const steps = parsed.steps;
        for (const step of steps) {
            // if (step.type === "plan") {
            //     console.log("PLAN:", step.plan);
            // }
            if (step.type == 'output') {
                console.log(step.output);
                shouldBreak = true;
                break;
            } else if (step.type == 'action') {
                const fn = tools[step.function];
                if (!fn) {
                    // console.log("Unknown function");
                    continue;
                }
                const observation = await fn(step.input);
                const observationMessage = {
                    type: 'observation',
                    observation: JSON.stringify(observation),
                }
                messages.push({ role: 'assistant', content: JSON.stringify(observationMessage) });

            }
        }
        if (shouldBreak) break;
    }
}