import re

with open('main_flask.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace imports
content = content.replace('from flask import Flask, request, jsonify', 'from fastapi import FastAPI, Request, HTTPException\nfrom fastapi.responses import JSONResponse')
content = content.replace('from flask_cors import CORS', 'from fastapi.middleware.cors import CORSMiddleware')

# Replace initialization
content = content.replace('app = Flask("AI FDP Hub - AI Service")\nCORS(app)', 'app = FastAPI(title="AI FDP Hub - AI Service")\n\napp.add_middleware(\n    CORSMiddleware,\n    allow_origins=["*"],\n    allow_credentials=True,\n    allow_methods=["*"],\n    allow_headers=["*"],\n)\n\n@app.on_event("startup")\nasync def startup_event():\n    logger.info("AI Service Running on Port 8000")\n    print("AI Service Running on Port 8000")')

# Route 1: ai_generate_fdp
content = re.sub(r'@app\.route\("/api/ai/ai-generate", methods=\["POST"\]\)\ndef ai_generate_fdp\(\):', '@app.post("/api/ai/ai-generate")\nasync def ai_generate_fdp(request: Request):', content)
content = content.replace('data = request.json', 'data = await request.json()')
content = content.replace('return jsonify(generate_fallback_fdp_outline', 'return generate_fallback_fdp_outline')
content = content.replace('return jsonify(parsed)', 'return parsed')

# Route 2: ai_generate_quiz
content = re.sub(r'@app\.route\("/api/ai/generate-quiz", methods=\["POST"\]\)\ndef ai_generate_quiz\(\):', '@app.post("/api/ai/generate-quiz")\nasync def ai_generate_quiz(request: Request):', content)
content = content.replace('return jsonify({"error": "No AI provider configured"}), 500', 'return JSONResponse(status_code=500, content={"error": "No AI provider configured"})')
content = content.replace('return jsonify({"error": "Failed to generate valid quiz JSON"}), 500', 'return JSONResponse(status_code=500, content={"error": "Failed to generate valid quiz JSON"})')

# Add missing aliases and new endpoints
new_endpoints = """
@app.post("/generate-content")
async def generate_content_endpoint(request: Request):
    return await ai_generate_fdp(request)

@app.post("/generate-quiz")
async def generate_quiz_endpoint(request: Request):
    return await ai_generate_quiz(request)

@app.post("/generate-summary")
async def generate_summary(request: Request):
    data = await request.json()
    topic = data.get("topic", "Topic")
    if not ai_provider: return {"summary": f"This is a fallback summary for {topic}."}
    system_prompt = 'Return a JSON object: {"summary": "String"}'
    prompt = f"Generate a concise 2-paragraph academic summary about: {topic}"
    res = call_ai(prompt, system_prompt, 1000)
    parsed = parse_json_response(res)
    return parsed if parsed else {"summary": f"Could not generate summary for {topic}."}

@app.post("/generate-notes")
async def generate_notes(request: Request):
    data = await request.json()
    topic = data.get("topic", "Topic")
    if not ai_provider: return {"notes": f"# Notes on {topic}\\n\\n- Key point 1"}
    system_prompt = 'Return a JSON object: {"notes": "String (Markdown format)"}'
    prompt = f"Generate comprehensive study notes in Markdown format for: {topic}"
    res = call_ai(prompt, system_prompt, 2000)
    parsed = parse_json_response(res)
    return parsed if parsed else {"notes": f"# Notes on {topic}\\nFailed to generate."}
"""

content = content.replace('@app.route("/health", methods=["GET"])\ndef health():\n    return jsonify(', new_endpoints + '\n@app.get("/health")\ndef health():\n    return ')

# Update main
content = content.replace('app.run(host="0.0.0.0", port=8000)', 'import uvicorn\n    uvicorn.run(app, host="0.0.0.0", port=8000)')

with open('main.py', 'w', encoding='utf-8') as f:
    f.write(content)
