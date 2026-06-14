import os
import json
import logging
import re
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask("AI FDP Hub - AI Service")
CORS(app)

ai_provider = None
gemini_model = None

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
if GEMINI_API_KEY and len(GEMINI_API_KEY.strip()) > 5:
    try:
        import google.generativeai as genai
        genai.configure(api_key=GEMINI_API_KEY.strip())
        gemini_model = genai.GenerativeModel("gemini-2.0-flash")
        ai_provider = "gemini"
        logger.info("✅ Gemini AI client initialized (gemini-2.0-flash)")
    except Exception as e:
        logger.warning(f"⚠️ Gemini client failed to initialize: {e}")

if not ai_provider:
    logger.warning("⚠️ No AI API key configured. Using fallbacks.")

def call_ai(prompt: str, system_prompt: str = "", max_tokens: int = 8000) -> str:
    if ai_provider == "gemini" and gemini_model:
        try:
            full_prompt = f"{system_prompt}\n\n{prompt}" if system_prompt else prompt
            response = gemini_model.generate_content(
                full_prompt,
                generation_config={"max_output_tokens": max_tokens, "temperature": 0.7, "response_mime_type": "application/json"}
            )
            return response.text
        except Exception as e:
            logger.error(f"Gemini API error: {e}")
            return ""
    return ""

def parse_json_response(text: str):
    if not text: return None
    clean = text.strip()
    if clean.startswith("```json"): clean = clean[7:]
    if clean.startswith("```"): clean = clean[3:]
    if clean.endswith("```"): clean = clean[:-3]
    try: return json.loads(clean.strip())
    except json.JSONDecodeError:
        match = re.search(r'\{[\s\S]*\}', clean)
        if match:
            try: return json.loads(match.group())
            except: pass
    return None

import random

def generate_fallback_fdp_outline(topic, category, difficulty, duration):
    words = [w for w in topic.split() if len(w) > 2]
    key_term = words[0] if words else "Technology"
    second_term = words[1] if len(words) > 1 else "Integration"
    
    # 1. Conceptual, 2. Practical, 3. Scenario, 4. Analytical, 5. Problem-solving...
    q_templates = [
        {
            "type": "Conceptual",
            "q": "What is the foundational architectural principle behind modern {topic} implementations in educational environments?",
            "ca": "Decoupled {key_term} processing combined with scalable asynchronous data streams.",
            "w1": "Monolithic tight-coupling of UI and database logic.",
            "w2": "Synchronous, blocking single-thread execution models.",
            "w3": "Manual batch processing of offline {second_term} data.",
            "expl": "Modern {topic} architectures rely heavily on decoupled and asynchronous streams to ensure horizontal scalability."
        },
        {
            "type": "Practical",
            "q": "When deploying {topic} across a university campus, which approach best minimizes integration friction?",
            "ca": "Adopting containerized {second_term} microservices via RESTful APIs.",
            "w1": "Rewriting all legacy systems from scratch using bare-metal servers.",
            "w2": "Forcing all departments to share a single massive database table.",
            "w3": "Deploying desktop-only offline applications.",
            "expl": "Containerization allows {topic} services to interact with existing university infrastructure seamlessly via standardized APIs."
        },
        {
            "type": "Scenario-based",
            "q": "A faculty member notices high latency when 500 students access the {topic} portal simultaneously. What is the most likely bottleneck?",
            "ca": "Unoptimized {key_term} database queries causing thread pool exhaustion.",
            "w1": "The students' local web browsers are outdated.",
            "w2": "The CSS files for the {second_term} UI are too large.",
            "w3": "The server's physical hard drive is vibrating.",
            "expl": "In high-concurrency scenarios for {topic}, database query optimization and connection pooling are the most critical factors."
        },
        {
            "type": "Analytical",
            "q": "Compare the impact of {key_term} algorithms versus traditional methods. What is the primary analytical advantage?",
            "ca": "They provide predictive insights into {second_term} patterns rather than just historical reports.",
            "w1": "They consume significantly more electricity.",
            "w2": "They completely eliminate the need for human administrators.",
            "w3": "They only work on mainframe computers.",
            "expl": "The true analytical power of {topic} lies in predictive modeling rather than purely descriptive historical reporting."
        },
        {
            "type": "Real-world application",
            "q": "How is {topic} actively being utilized to transform personalized student learning paths?",
            "ca": "By dynamically adjusting {key_term} content delivery based on real-time comprehension metrics.",
            "w1": "By printing customized textbooks for every student.",
            "w2": "By forcing students to memorize longer {second_term} documents.",
            "w3": "By disabling the internet during lectures.",
            "expl": "Real-time comprehension metrics allow {topic} systems to pivot instructional content dynamically."
        },
        {
            "type": "Problem solving",
            "q": "During a {topic} migration, data integrity between the old and new system is compromised. What is the immediate remediation step?",
            "ca": "Initiate a rollback to the last verified {key_term} snapshot and audit the migration logs.",
            "w1": "Ignore the errors and proceed with the {second_term} deployment.",
            "w2": "Delete the old database to force the new system to work.",
            "w3": "Ask students to manually re-enter their data.",
            "expl": "Data integrity in {topic} transitions requires immediate fallback to verified snapshots to prevent cascading corruption."
        },
        {
            "type": "Technology comparison",
            "q": "When choosing a framework for {topic}, why might a university prefer an open-source {key_term} stack over a proprietary one?",
            "ca": "Greater flexibility for custom academic extensions and lack of vendor lock-in.",
            "w1": "Open-source {second_term} software never requires maintenance or updates.",
            "w2": "Proprietary stacks cannot connect to the internet.",
            "w3": "Universities are not legally allowed to buy proprietary software.",
            "expl": "Open-source solutions in {topic} allow academic institutions to modify the source code for highly specialized research needs."
        },
        {
            "type": "Case-study",
            "q": "In the MIT case study on {topic}, what was the defining factor that led to a 40% increase in student retention?",
            "ca": "Implementing adaptive {key_term} feedback loops in early-stage assessments.",
            "w1": "Replacing all professors with {second_term} robots.",
            "w2": "Making the exams 50% easier.",
            "w3": "Removing all deadlines from the curriculum.",
            "expl": "Adaptive feedback loops, a core component of {topic}, intervene exactly when students struggle, drastically improving retention."
        },
        {
            "type": "Conceptual",
            "q": "What role does {second_term} play in securing the underlying infrastructure of {topic}?",
            "ca": "It ensures cryptographic verification and immutable logging of administrative actions.",
            "w1": "It acts as a firewall against physical intrusions.",
            "w2": "It automatically grades student essays.",
            "w3": "It translates the code into multiple languages.",
            "expl": "Security in modern {topic} architectures relies on immutable logging and cryptographic verification to prevent unauthorized state changes."
        },
        {
            "type": "Analytical",
            "q": "Which performance metric indicates that a {topic} implementation is operating at peak efficiency?",
            "ca": "High {key_term} throughput combined with sub-millisecond p99 latency.",
            "w1": "A high rate of 500 Internal Server Errors.",
            "w2": "Maximum CPU utilization at all times.",
            "w3": "A very large codebase size.",
            "expl": "Efficiency in {topic} is defined by processing high throughput while maintaining low tail latency (p99) for end users."
        }
    ]
    
    questions = []
    # Shuffle templates to ensure variety
    random.shuffle(q_templates)
    
    for i, t in enumerate(q_templates[:10]):
        # Format the strings with topic variables
        q_text = t["q"].format(topic=topic, key_term=key_term, second_term=second_term)
        ca = t["ca"].format(topic=topic, key_term=key_term, second_term=second_term)
        w1 = t["w1"].format(topic=topic, key_term=key_term, second_term=second_term)
        w2 = t["w2"].format(topic=topic, key_term=key_term, second_term=second_term)
        w3 = t["w3"].format(topic=topic, key_term=key_term, second_term=second_term)
        expl = t["expl"].format(topic=topic, key_term=key_term, second_term=second_term)
        
        # Randomize options layout
        opts = [ca, w1, w2, w3]
        random.shuffle(opts)
        
        correct_idx = opts.index(ca)
        
        questions.append({
            "id": i + 1,
            "question": q_text,
            "options": opts,
            "correctAnswer": correct_idx,
            "explanation": expl,
            "marks": 10
        })

    module_content = f"""## Introduction to {topic}

Welcome to this professional development module on {topic}. As the academic landscape shifts, understanding {key_term} and its applications is more critical than ever.

### Objectives
- Master the foundational concepts of {topic}.
- Implement scalable {second_term} solutions.
- Analyze real-world case studies in educational technology.

### Key Concepts
1. **Adaptive Architecture**: Using {key_term} to build resilient systems.
2. **Contextual Integration**: How {second_term} bridges the gap between theory and practice.

### Detailed Explanation
When universities adopt {topic}, they move away from rigid, monolithic systems. Instead, they embrace modularity. This means {key_term} can be updated independently without taking down the entire student portal. 

### Real-world Applications
Institutions globally are using {topic} to predict student dropouts and personalize learning trajectories in real-time.

### Industry Use Cases
- **EdTech Platforms**: Leveraging {second_term} for massive open online courses.
- **University IT**: Deploying secure, scalable {key_term} infrastructure.

### Best Practices
- Always ensure data compliance when integrating {topic}.
- Use containerized microservices for {second_term}.

### Advantages & Challenges
**Advantages**: Unprecedented scalability and deep analytical insights.
**Challenges**: The steep learning curve of migrating legacy data into a {topic} ecosystem.

### Summary
By understanding the mechanics of {key_term}, faculty can design better curricula that prepare students for the modern workforce.

### Key Takeaways
- {topic} is highly modular.
- Focus on {second_term} for seamless integration."""

    return {
        "title": topic,
        "description": f"An intensive professional development program tailored for faculty to master {topic} and integrate its {key_term} applications into university curriculum.",
        "learningOutcomes": [
            f"Analyze and critically evaluate the fundamental principles of {topic}.",
            f"Design and deploy practical {second_term} implementations.",
            f"Formulate modern pedagogical strategies leveraging {key_term}."
        ],
        "completionCriteria": "Participants must actively complete all learning modules, secure a minimum of 70% in the final assessment, and submit the capstone.",
        "recommendedResources": f"1. Standard academic journals on {topic}.\n2. Official documentation for {key_term} toolkits.",
        "passingScore": 70.0,
        "modules": [
            {
                "title": f"Fundamentals and Architecture of {topic}",
                "description": f"Exploring the core theoretical components of {key_term} and {second_term}.",
                "content": module_content,
                "duration": "4 hours"
            }
        ],
        "quizzes": questions,
        "assignments": [
            {
                "title": f"Curriculum Integration Plan for {topic}",
                "description": f"Draft a comprehensive 3-page proposal detailing how you will integrate {key_term} concepts into your existing department curriculum.",
                "deadline": "End of Week 2",
                "maxMarks": 50
            }
        ]
    }

@app.route("/api/ai/ai-generate", methods=["POST"])
def ai_generate_fdp():
    data = request.json
    topic = data.get("topic", "Advanced Technology")
    category = data.get("category", "General")
    difficulty = data.get("difficulty", "Intermediate")
    duration = data.get("duration", "4 Weeks")
    
    if not ai_provider: 
        return jsonify(generate_fallback_fdp_outline(topic, category, difficulty, duration))

    system_prompt = """You are a world-class academic curriculum designer and expert professor designing a Faculty Development Program (FDP).
Your job is to generate highly realistic, deeply educational, and uniquely customized course content based on the requested topic.

CRITICAL RULES:
1. NO generic placeholder text. Do not use filler words. Write ACTUAL dense educational content.
2. The `content` field inside `modules` MUST be long-form, rich Markdown. Every single module MUST contain the following explicit headings (with robust paragraph text under each): Introduction, Objectives, Key Concepts, Detailed Explanation, Real-world Applications, Industry Use Cases, Best Practices, Advantages & Challenges, Summary, Key Takeaways. Use bold text, bullet points, and code snippets where relevant.
3. Generate exactly 4 comprehensive modules.
4. Generate EXACTLY 10 difficult, academically rigorous multiple-choice questions for the quiz covering easy, medium, and hard difficulties (conceptual, scenario-based, practical, analytical, and real-world problem-solving).
5. QUIZ RANDOMIZATION CRITICAL RULE: You MUST randomly distribute the correct answer. The quiz `options` MUST be an array of exactly 4 strings. The `correctAnswer` MUST be the index (0, 1, 2, or 3) of the correct option in the options array. Every question MUST include a detailed `explanation` string explaining why the answer is correct.
6. Generate 1 or 2 realistic capstone assignments.

You MUST return a valid JSON object strictly matching this schema:
{
  "title": "String (The exact topic name)",
  "description": "String (A professional 2-3 sentence overview of the FDP)",
  "learningOutcomes": ["String", "String", "String"],
  "completionCriteria": "String",
  "recommendedResources": "String",
  "passingScore": 70.0,
  "modules": [
    {
      "title": "String (e.g. 'Foundations of Data Engineering')",
      "description": "String (1 sentence overview)",
      "content": "String (Extensive Markdown text containing specific sections: Introduction, Objectives, Key Concepts, Detailed Explanation, Real-world Applications, Industry Use Cases, Best Practices, Advantages & Challenges, Summary, Key Takeaways)",
      "duration": "String (e.g. '4 hours')"
    }
  ],
  "quizzes": [
    {
      "id": 1,
      "question": "String",
      "options": [
        "String",
        "String",
        "String",
        "String"
      ],
      "correctAnswer": 1,
      "explanation": "String (Detailed explanation of why the answer is correct)",
      "marks": 10
    }
  ],
  "assignments": [
    {
      "title": "String",
      "description": "String",
      "deadline": "String (e.g. 'End of Week 2')",
      "maxMarks": 50
    }
  ]
}"""

    prompt = f"Please generate a complete {difficulty}-level FDP curriculum for the topic: '{topic}'. The program duration is {duration}. The category is {category}."
    
    res = call_ai(prompt, system_prompt, 8000)
    parsed = parse_json_response(res)
    
    if parsed and "modules" in parsed: 
        return jsonify(parsed)
        
    logger.warning("AI generation failed or returned invalid JSON. Falling back.")
    return jsonify(generate_fallback_fdp_outline(topic, category, difficulty, duration))


@app.route("/api/ai/generate-quiz", methods=["POST"])
def ai_generate_quiz():
    data = request.json
    topic = data.get("topic", "Advanced Technology")
    category = data.get("category", "General")
    difficulty = data.get("difficulty", "Intermediate")
    count = data.get("question_count", 10)
    modules_text = data.get("modules", "General overview of the topic")
    learning_content = data.get("learningContent", "Core principles and applications")

    if not ai_provider: 
        return jsonify({"error": "No AI provider configured"}), 500

    system_prompt = f"""You are a world-class academic curriculum designer and expert professor designing a Quiz for a Faculty Development Program (FDP).
Your job is to generate highly realistic, deeply educational, and uniquely customized questions based on the ACTUAL course content provided.

CRITICAL RULES:
1. Questions must relate ONLY to this FDP. Avoid generic educational questions like "What is the primary objective of this course?".
2. Do NOT reuse generic templates. Generate completely unique questions based on the provided modules and learning content.
3. Generate exactly {count} professional MCQs.
4. Generate different question styles: Conceptual, Scenario-based, Case-study, Analytical, and Real-world application.
5. QUIZ RANDOMIZATION: Randomize question structures, option placements, and explanation styles.
6. The `options` MUST be an array of exactly 4 strings. The `correctAnswer` MUST be the index (0, 1, 2, or 3) of the correct option in the options array.
7. Every question MUST include a detailed `explanation` string explaining why the answer is correct based on the course material.

You MUST return a valid JSON object strictly matching this schema:
{{
  "topic": "String",
  "totalQuestions": {count},
  "passingScore": 60,
  "questions": [
    {{
      "id": 1,
      "question": "String",
      "options": [
        "String",
        "String",
        "String",
        "String"
      ],
      "correctAnswer": 1,
      "explanation": "String",
      "marks": 10
    }}
  ]
}}"""

    prompt = f"""Generate {count} unique professional MCQs for:
Course: {topic}
Category: {category}
Difficulty: {difficulty}

Modules:
{modules_text}

Learning Content:
{learning_content}"""
    
    res = call_ai(prompt, system_prompt, 4000)
    parsed = parse_json_response(res)
    
    if parsed and "questions" in parsed: 
        return jsonify(parsed)
        
    logger.warning("AI quiz generation failed or returned invalid JSON.")
    return jsonify({"error": "Failed to generate valid quiz JSON"}), 500


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "healthy", "ai_provider": ai_provider or "none", "service": "AI FDP Hub Flask (Dynamic V2.1)"})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000)
