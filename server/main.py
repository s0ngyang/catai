from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import openai
import requests
import os

app = FastAPI()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
openai.api_key = OPENAI_API_KEY

CAT_API_URL = "https://api.thecatapi.com/v1/images/search"


class QueryRequest(BaseModel):
    message: str


class CatRequest(BaseModel):
    breed: str = None
    count: int = 1


@app.post("/chat")
async def chat_with_openai(request: QueryRequest):
    try:
        response = openai.Completion.create(
            engine="gpt-4",  # Change this to "gpt-4o-mini" if needed
            prompt=request.message,
            max_tokens=100
        )
        return {"response": response.choices[0].text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/get_cats")
async def get_cats(request: CatRequest):
    params = {"limit": request.count}
    if request.breed:
        params["breed_id"] = request.breed
    try:
        response = requests.get(CAT_API_URL, params=params)
        if response.status_code == 200:
            return response.json()
        else:
            raise HTTPException(
                status_code=500, detail="Failed to fetch cat images.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
