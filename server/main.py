from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import openai
import os
from dotenv import load_dotenv

# Load environment variables from the .env file
load_dotenv()

app = FastAPI()
openai.api_key = os.getenv("OPENAI_API_KEY")
assistant_id = os.getenv("ASSISTANT_ID")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # You can restrict this to specific origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods (GET, POST, OPTIONS, etc.)
    allow_headers=["*"],  # Allows all headers
)


@app.post("/create_thread")
async def create_thread():
    try:
        thread = openai.beta.threads.create()
        return {"threadId": thread.id}
    except Exception as e:
        return {"error": str(e)}


@app.post("/add_message/{thread_id}")
async def add_message(thread_id: str, request: Request):
    body = await request.json()
    content = body.get("content", "")

    try:
        message = openai.beta.threads.messages.create(
            thread_id=thread_id,
            role="user",
            content=content
        )

        run = openai.beta.threads.runs.create(
            thread_id=thread_id,
            assistant_id=assistant_id
        )
        return {"message": message, "runId": run.id}

    except Exception as e:
        return {"error": str(e)}


@app.get("/retrieve_status")
async def check_run_status(thread_id: str, run_id: str):
    # Return the current status of the run
    if not thread_id:
        return {"error": "No thread id provided", "status": 400}
    if not run_id:
        return {"error": "No run id provided", "status": 400}

    try:
        run = openai.beta.threads.runs.retrieve(
            thread_id=thread_id, run_id=run_id)
        return {"run": run}
    except Exception as e:
        return {"error": e, "status": 400}


@app.get("/list_messages/{thread_id}")
async def retrieve_messages(thread_id: str):
    try:
        messages = openai.beta.threads.messages.list(thread_id=thread_id)
        return {"messages": messages}
    except Exception as e:
        return {"error": str(e)}


@app.post("/submit_tool_outputs")
async def submit_tool_outputs(thread_id: str, run_id: str, request: Request):
    body = await request.json()
    tool_outputs = body.get("toolOutputs", [])
    print(tool_outputs)
    try:
        openai.beta.threads.runs.submit_tool_outputs(
            thread_id=thread_id,
            run_id=run_id,
            tool_outputs=tool_outputs
        )
        return {"status": "success"}
    except Exception as e:
        return {"status": e}
