package com.aifdphub.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

/**
 * Service that communicates with the Python FastAPI AI microservice.
 * Falls back to structured mock responses when the AI service is unavailable.
 */
@Service
public class AIService {

    private static final Logger log = LoggerFactory.getLogger(AIService.class);

    @Value("${ai.service.url}")
    private String aiServiceUrl;

    private final RestTemplate restTemplate;

    public AIService() {
        this.restTemplate = new RestTemplate();
    }

    /**
     * Generate course content (notes, summaries) for a given topic.
     */
    public Map<String, Object> generateContent(String topic, String level, String duration) {
        try {
            Map<String, String> request = new HashMap<>();
            request.put("topic", topic);
            request.put("level", level != null ? level : "Intermediate");
            request.put("duration", duration != null ? duration : "5 days");

            ResponseEntity<Map> response = restTemplate.postForEntity(
                    aiServiceUrl + "/api/ai/generate-content", request, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }
        } catch (Exception e) {
            log.warn("AI service unavailable for content generation, using fallback: {}", e.getMessage());
        }

        return generateFallbackContent(topic, level, duration);
    }

    /**
     * Generate FULL FDP content (modules + quizzes + assignments + outcomes) via the AI service.
     * This endpoint returns the complete schema needed to populate all FDP fields.
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> generateFullContent(String topic, String category, String difficulty, String duration) {
        try {
            Map<String, Object> request = new HashMap<>();
            request.put("topic", topic);
            request.put("category", category != null ? category : "General");
            request.put("difficulty", difficulty != null ? difficulty : "Intermediate");
            request.put("duration", duration != null ? duration : "4 Weeks");
            request.put("instructorName", "");
            request.put("maxSeats", 50);

            log.info("Calling AI service for full content generation: topic={}, category={}", topic, category);

            ResponseEntity<Map> response = restTemplate.postForEntity(
                    aiServiceUrl + "/api/ai/ai-generate", request, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> body = response.getBody();

                // Check if AI service returned an error (e.g., no API key)
                if (body.containsKey("error")) {
                    log.warn("AI service returned error: {}", body.get("error"));
                    return body;
                }

                log.info("AI service returned full content successfully");
                return body;
            }
        } catch (Exception e) {
            log.error("AI service unavailable for full content generation: {}", e.getMessage());
        }

        // Return a structured error instead of silent fallback
        Map<String, Object> errorResult = new HashMap<>();
        errorResult.put("error", "AI service is unavailable. Please ensure the AI service is running on " + aiServiceUrl);
        return errorResult;
    }

    /**
     * Generate quiz questions for a given topic.
     */
    public Map<String, Object> generateQuiz(String topic, int questionCount) {
        try {
            Map<String, Object> request = new HashMap<>();
            request.put("topic", topic);
            request.put("question_count", questionCount);

            ResponseEntity<Map> response = restTemplate.postForEntity(
                    aiServiceUrl + "/api/ai/generate-quiz", request, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }
        } catch (Exception e) {
            log.warn("AI service unavailable for quiz generation, using fallback: {}", e.getMessage());
        }

        return generateFallbackQuiz(topic, questionCount);
    }

    /**
     * Evaluate quiz answers using AI.
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> evaluateAnswers(String topic, Object answers, Object correctAnswers) {
        // Compute exact score deterministically instead of using AI or dummy responses
        return generateRealEvaluation(topic, answers, correctAnswers);
    }

    /**
     * Computes REAL scores by comparing submitted answers against correct answers.
     */
    @SuppressWarnings("unchecked")
    private Map<String, Object> generateRealEvaluation(String topic, Object answersObj, Object correctObj) {
        Map<String, Object> result = new HashMap<>();
        int correct = 0, total = 0;
        java.util.List<Map<String, Object>> breakdown = new java.util.ArrayList<>();

        Map<String, String> userAnswers = new HashMap<>();
        if (answersObj instanceof Map) {
            ((Map<?, ?>) answersObj).forEach((k, v) -> userAnswers.put(k.toString(), v.toString()));
        }

        java.util.List<String> correctList = new java.util.ArrayList<>();
        if (correctObj instanceof java.util.List) {
            for (Object o : (java.util.List<?>) correctObj) correctList.add(o.toString());
        }

        total = Math.max(userAnswers.size(), correctList.size());
        if (total == 0) total = 1;

        for (int i = 0; i < correctList.size(); i++) {
            String qKey = String.valueOf(i + 1);
            String selectedOptionId = userAnswers.getOrDefault(qKey, "");
            String correctOptionId = correctList.get(i);
            boolean isCorrect = selectedOptionId.trim().equalsIgnoreCase(correctOptionId.trim());
            
            System.out.println("Java Evaluation - Question Index: " + i + " | Selected: " + selectedOptionId + " | Correct: " + correctOptionId + " | Match: " + isCorrect);
            
            if (isCorrect) correct++;

            Map<String, Object> qResult = new HashMap<>();
            qResult.put("questionNumber", i + 1);
            qResult.put("yourAnswer", selectedOptionId);
            qResult.put("correctAnswer", correctOptionId);
            qResult.put("isCorrect", isCorrect);
            breakdown.add(qResult);
        }

        double percentage = Math.round((correct * 100.0) / total * 10.0) / 10.0;
        String grade;
        if (percentage >= 90) grade = "A+";
        else if (percentage >= 80) grade = "A";
        else if (percentage >= 70) grade = "B+";
        else if (percentage >= 60) grade = "B";
        else if (percentage >= 50) grade = "C";
        else grade = "F";

        result.put("score", correct);
        result.put("totalMarks", total);
        result.put("percentage", percentage);
        result.put("grade", grade);
        result.put("passed", percentage >= 60);
        result.put("breakdown", breakdown);

        String feedback;
        if (percentage == 100) feedback = "Outstanding! You answered every question correctly. Exceptional mastery of " + topic + ".";
        else if (percentage >= 80) feedback = "Excellent performance in " + topic + ". You demonstrated strong understanding across most areas.";
        else if (percentage >= 60) feedback = "Good work on " + topic + ". You've met the passing criteria but there are areas to strengthen.";
        else feedback = "You need further study in " + topic + ". Review the modules where you answered incorrectly and retake the assessment.";
        result.put("feedback", feedback);

        java.util.List<String> strengths = new java.util.ArrayList<>();
        java.util.List<String> weaknesses = new java.util.ArrayList<>();
        for (Map<String, Object> b : breakdown) {
            if ((boolean) b.get("isCorrect")) strengths.add("Q" + b.get("questionNumber") + " — correct");
            else weaknesses.add("Q" + b.get("questionNumber") + " — expected: " + b.get("correctAnswer"));
        }
        result.put("strengths", strengths);
        result.put("weaknesses", weaknesses);
        return result;
    }

    /**
     * Get personalized learning recommendations.
     */
    public Map<String, Object> getRecommendations(Object skills, Object interests, Object completedFdps) {
        try {
            Map<String, Object> request = new HashMap<>();
            request.put("skills", skills);
            request.put("interests", interests);
            request.put("completed_fdps", completedFdps);

            ResponseEntity<Map> response = restTemplate.postForEntity(
                    aiServiceUrl + "/api/ai/recommend", request, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }
        } catch (Exception e) {
            log.warn("AI service unavailable for recommendations, using fallback: {}", e.getMessage());
        }

        return generateFallbackRecommendations();
    }

    /**
     * Perform skill gap analysis.
     */
    public Map<String, Object> analyzeSkillGap(Object skills, Object targetSkills) {
        try {
            Map<String, Object> request = new HashMap<>();
            request.put("current_skills", skills);
            request.put("target_skills", targetSkills);

            ResponseEntity<Map> response = restTemplate.postForEntity(
                    aiServiceUrl + "/api/ai/skill-gap", request, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }
        } catch (Exception e) {
            log.warn("AI service unavailable for skill gap analysis, using fallback: {}", e.getMessage());
        }

        return generateFallbackSkillGap();
    }

    /**
     * AI Chatbot / Mentor interaction.
     */
    public Map<String, Object> chat(String message, String context) {
        try {
            Map<String, String> request = new HashMap<>();
            request.put("message", message);
            request.put("context", context != null ? context : "");

            ResponseEntity<Map> response = restTemplate.postForEntity(
                    aiServiceUrl + "/api/ai/chatbot", request, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }
        } catch (Exception e) {
            log.warn("AI service unavailable for chat, using fallback: {}", e.getMessage());
        }

        return Map.of("reply", "As your AI Mentor, I suggest exploring advanced topics related to your query: " + message +
                ". Consider reviewing the latest FDP programs available on the platform for structured learning.");
    }

    // ===== Fallback Methods =====

    private Map<String, Object> generateFallbackContent(String topic, String level, String duration) {
        Map<String, Object> result = new HashMap<>();
        String t = topic;
        result.put("title", t);
        result.put("description", "Comprehensive " + level + " level course on " + t + " designed for faculty development over " + duration + ".");

        String m1 = "## Welcome to " + t + "\n\nThis module lays the foundation for your learning journey.\n\n### Why This Matters\n\nIn an era of rapid technological change, faculty members must stay current with " + t + " to remain effective educators. This FDP bridges the gap between theoretical knowledge and practical classroom application.\n\n### Key Concepts\n\n**1. Definition & Scope** — " + t + " encompasses a broad set of methodologies, tools, and frameworks that are transforming how we teach, assess, and engage students.\n\n**2. Historical Context** — Tracing the evolution from traditional approaches to modern practices helps us appreciate the paradigm shifts that have occurred.\n\n**3. Current Landscape** — Today, institutions worldwide are adopting " + t + " as part of NEP 2020, NBA accreditation, and AICTE quality mandates.\n\n### Reading: The State of " + t + " in Indian Higher Education\n\nIndia's higher education system serves over 40 million students across 1,000+ universities. Research from IITs and IIMs demonstrates that faculty who adopt these practices see a 30-40% improvement in student engagement metrics.\n\n### Activity\n\nReflect on your current teaching practice. Identify three areas where " + t + " could enhance your students' learning outcomes.\n\n### Key Takeaways\n\n- " + t + " is becoming a core competency for modern educators\n- Understanding the historical context helps us make better decisions\n- Indian institutions are at an inflection point for widespread adoption";

        String m2 = "## Deep Dive: Core Methodologies\n\nBuilding on yesterday's foundation, this module explores the fundamental methodologies and frameworks.\n\n### Theoretical Frameworks\n\n**Bloom's Taxonomy & " + t + "** — We examine how " + t + " maps to each level of Bloom's Taxonomy, from basic recall (Remember) through creative application (Create).\n\n**Constructivist Learning Theory** — " + t + " aligns naturally with constructivist approaches where learners build knowledge through experience.\n\n### Core Methodologies\n\n**1. Problem-Based Learning (PBL)** — Students work on real-world problems. Research shows PBL increases retention by up to 50%.\n\n**2. Flipped Classroom Model** — Faculty prepare enhanced materials for pre-class study, using class time for hands-on problem-solving.\n\n**3. Collaborative Learning** — Enables new forms of collaboration through shared workspaces and peer review systems.\n\n### Case Study: VIT Vellore Implementation\n\nThe CSE department at VIT implemented " + t + " across 12 courses in 2024. Faculty reported: 87% found the transition manageable, 92% observed improved student participation, and average exam scores improved by 15 percentile points.\n\n### Hands-On Exercise\n\nDesign a 45-minute lesson plan for one of your courses that incorporates at least two of the methodologies discussed above.\n\n### Key Takeaways\n\n- Strong theoretical grounding ensures sustainable adoption\n- PBL and flipped classroom models are the most effective strategies\n- Real institutional case studies validate the practical feasibility";

        String m3 = "## From Theory to Practice\n\nThis is the most hands-on day of the FDP. We move from theoretical understanding to practical implementation.\n\n### Tools & Platforms\n\n**1. Learning Management Systems** — Configuring Moodle, Google Classroom, or Canvas. We cover course structure, assignment design, and analytics dashboards.\n\n**2. Assessment Tools** — Designing rubric-based assessments, automated quiz generators, and peer evaluation workflows. These tools reduce grading time by 60%.\n\n**3. Content Creation** — Using open-source tools to create interactive study materials, digital notebooks, and problem sets.\n\n### Implementation Blueprint\n\n**Phase 1 — Pilot (Week 1-2):** Select one course section. Implement basic techniques. Gather student feedback.\n\n**Phase 2 — Iterate (Week 3-4):** Refine based on feedback. Add assessment components. Train teaching assistants.\n\n**Phase 3 — Scale (Month 2-3):** Expand to additional sections. Document best practices.\n\n### Common Pitfalls\n\n- **Over-engineering:** Start simple. A well-designed worksheet is better than a complex system nobody uses.\n- **Ignoring accessibility:** Ensure all materials work on mobile devices.\n- **Skipping the pilot:** Always test with a small group before full deployment.\n\n### Key Takeaways\n\n- Practical tools exist for every budget\n- The three-phase approach minimizes risk\n- Start simple, iterate fast, and scale what works";

        String m4 = "## Pushing the Boundaries\n\nWe now explore cutting-edge developments in " + t + " that are shaping the future of education.\n\n### Emerging Trends\n\n**1. Adaptive Learning Systems** — AI-powered platforms that adjust difficulty and content based on individual student performance. Early adopters report 25% faster learning curves.\n\n**2. Learning Analytics & Predictive Models** — Using data to predict at-risk students and personalize interventions. Early-warning systems improve retention by 15-20%.\n\n**3. Blockchain for Academic Credentials** — Tamper-proof digital certificates that students can verify and share globally.\n\n### Research Opportunities\n\nFaculty members are uniquely positioned to contribute to " + t + " research:\n\n- **Effectiveness studies:** Comparing outcomes between traditional and enhanced courses\n- **Equity analysis:** Investigating whether tools benefit all student demographics equally\n- **Faculty adoption patterns:** Understanding barriers in Indian universities\n\n### Discussion\n\nIdentify one research question you could investigate in your own institutional context. Share your question with the group.\n\n### Key Takeaways\n\n- Adaptive learning and predictive analytics represent the next wave\n- Faculty research in this area is both impactful and publishable\n- Blockchain credentials are moving from experimental to mainstream";

        String m5 = "## Bringing It All Together\n\nThe final day consolidates everything you have learned.\n\n### Final Assessment\n\n**Part A — MCQ Quiz (40%):** Multiple-choice questions covering all modules. Score 60% or above to earn your certificate.\n\n**Part B — Implementation Plan (60%):** Submit a written plan describing how you will integrate " + t + " into one of your courses.\n\n### Certificate of Completion\n\nUpon passing, you will receive a digitally verified certificate that is:\n\n- **SHA-256 hashed** for tamper-proof verification\n- **Blockchain-registered** on the Ethereum network\n- **Publicly verifiable** using the certificate ID\n\n### Your 90-Day Action Plan\n\n- **Month 1:** Implement your pilot in one course section\n- **Month 2:** Gather data and iterate based on student feedback\n- **Month 3:** Share results with your department and plan for scaling\n\n### Key Takeaways\n\n- Certification requires both knowledge (quiz) and application (plan)\n- Peer feedback enriches your implementation approach\n- The 90-day plan ensures post-FDP continuity and real impact";

        result.put("modules", java.util.List.of(
                Map.of("title", "Introduction to " + t, "content", m1, "duration", "Day 1 · 6 hours"),
                Map.of("title", "Core Concepts & Methodologies", "content", m2, "duration", "Day 2 · 6 hours"),
                Map.of("title", "Practical Applications & Tools", "content", m3, "duration", "Day 3 · 6 hours"),
                Map.of("title", "Advanced Topics & Research", "content", m4, "duration", "Day 4 · 6 hours"),
                Map.of("title", "Assessment & Certification", "content", m5, "duration", "Day 5 · 6 hours")
        ));
        result.put("learningOutcomes", java.util.List.of(
                "Understand fundamental concepts of " + topic,
                "Apply " + topic + " methodologies in teaching practice",
                "Design curriculum incorporating " + topic + " principles",
                "Evaluate and analyze research in " + topic,
                "Develop implementation strategies for institutional adoption"
        ));
        return result;
    }

    private Map<String, Object> generateFallbackQuiz(String topic, int count) {
        java.util.List<Map<String, Object>> questions = new java.util.ArrayList<>();
        String[][] questionBank = {
                {"What is the primary objective of " + topic + "?",
                        "To enhance teaching methodologies", "To increase enrollment",
                        "To reduce costs", "To replace faculty",
                        "To enhance teaching methodologies"},
                {"Which approach is most effective for implementing " + topic + "?",
                        "Phased implementation with feedback", "Immediate full deployment",
                        "Top-down mandate", "No implementation needed",
                        "Phased implementation with feedback"},
                {"What is a key benefit of " + topic + " in higher education?",
                        "Improved learning outcomes", "Reduced faculty workload only",
                        "Lower student fees", "Fewer courses needed",
                        "Improved learning outcomes"},
                {"How should " + topic + " be assessed in an FDP?",
                        "Through practical demonstrations and portfolios", "Only written exams",
                        "Student surveys only", "No assessment needed",
                        "Through practical demonstrations and portfolios"},
                {"What is the role of technology in " + topic + "?",
                        "Enabler for enhanced learning experiences", "Complete replacement for teaching",
                        "Optional add-on with no impact", "Only for administrative tasks",
                        "Enabler for enhanced learning experiences"}
        };

        java.util.Random rand = new java.util.Random();
        for (int i = 0; i < Math.min(count, questionBank.length); i++) {
            Map<String, Object> q = new HashMap<>();
            q.put("id", i + 1);
            q.put("question", questionBank[i][0]);
            
            java.util.List<String> optTexts = new java.util.ArrayList<>(java.util.List.of(questionBank[i][1], questionBank[i][2], questionBank[i][3], questionBank[i][4]));
            java.util.Collections.shuffle(optTexts, rand);
            
            int correctAnswer = optTexts.indexOf(questionBank[i][5]);
            
            q.put("options", optTexts);
            q.put("correctAnswer", correctAnswer);
            q.put("explanation", "The correct answer is " + questionBank[i][5]);
            q.put("marks", 10);
            questions.add(q);
        }

        return Map.of(
                "topic", topic,
                "totalQuestions", questions.size(),
                "passingScore", 60,
                "questions", questions
        );
    }


    private Map<String, Object> generateFallbackRecommendations() {
        return Map.of(
                "recommendations", java.util.List.of(
                        Map.of("title", "AI in Education", "reason", "Aligns with your teaching interests", "priority", "High"),
                        Map.of("title", "Blockchain for Academic Credentials", "reason", "Emerging technology skill gap", "priority", "Medium"),
                        Map.of("title", "Outcome-Based Education Framework", "reason", "NEP 2020 alignment", "priority", "High"),
                        Map.of("title", "Research Methodology", "reason", "Foundation for academic growth", "priority", "Medium")
                )
        );
    }

    private Map<String, Object> generateFallbackSkillGap() {
        return Map.of(
                "analysis", "Based on your current skill profile, there are opportunities for growth in emerging technologies and pedagogical innovation.",
                "gaps", java.util.List.of(
                        Map.of("skill", "AI/ML Integration", "currentLevel", 30, "targetLevel", 70, "priority", "High"),
                        Map.of("skill", "Blockchain Technology", "currentLevel", 20, "targetLevel", 60, "priority", "Medium"),
                        Map.of("skill", "Digital Pedagogy", "currentLevel", 50, "targetLevel", 80, "priority", "High"),
                        Map.of("skill", "Research Analytics", "currentLevel", 40, "targetLevel", 75, "priority", "Medium")
                ),
                "recommendedFdps", java.util.List.of("AI Fundamentals for Educators", "Web3 Technology Workshop")
        );
    }

    /**
     * Generate a complete FDP outline using AI.
     */
    public Map<String, Object> aiGenerateFdp(String topic, String category, String difficulty, String duration, String instructorName, int maxSeats) {
        try {
            Map<String, Object> request = new HashMap<>();
            request.put("topic", topic);
            request.put("category", category);
            request.put("difficulty", difficulty);
            request.put("duration", duration);
            request.put("instructorName", instructorName);
            request.put("maxSeats", maxSeats);

            ResponseEntity<Map> response = restTemplate.postForEntity(
                    aiServiceUrl + "/api/ai/ai-generate", request, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }
        } catch (Exception e) {
            log.warn("AI service unavailable for FDP outline generation, using fallback: {}", e.getMessage());
        }

        return generateFallbackFdpOutline(topic, category, difficulty, duration, instructorName, maxSeats);
    }

    private Map<String, Object> generateFallbackFdpOutline(String topic, String category, String difficulty, String duration, String instructorName, int maxSeats) {
        Map<String, Object> result = new HashMap<>();
        String title = topic;
        String desc = "This program provides educators with the knowledge and tools required to effectively teach and implement " + topic + " concepts. Over " + duration + ", participants will master modern methodologies and integrate them into their coursework.";

        result.put("title", title);
        result.put("description", desc);
        result.put("learningOutcomes", "Demonstrate a solid understanding of " + topic + " fundamentals and architecture, Integrate " + topic + " concepts into your curriculum and classroom activities, Critically analyze the security, privacy, and performance parameters of " + topic + " implementations");
        result.put("completionCriteria", "Participants must review all 4 modules, achieve at least 70% on the quiz, and score at least 50% on both assignments.");
        result.put("recommendedResources", "1. Introduction to modern " + topic + " systems by Prof. " + instructorName + "\n2. Official developer documentation and academic papers.");
        result.put("passingScore", 70.0);

        java.util.List<Map<String, Object>> modules = new java.util.ArrayList<>();
        String[] titles = {
            "Introduction to " + topic + " Systems",
            "Methodologies & Design Frameworks for " + topic,
            "Practical Labs and Deployment of " + topic,
            "Assessment Strategies and Case Studies in " + topic
        };
        String[] descs = {
            "Overview of the core architecture, evolution, and significance of " + topic + " in modern industry.",
            "Exploring design principles, theoretical concepts, and pedagogical structures for " + topic + ".",
            "Hands-on exercises, tool installation, configuration, and debugging of " + topic + " projects.",
            "Analyzing real-world deployments and designing academic evaluations for students."
        };
        String[] dur = {"2 hours", "3 hours", "4 hours", "3 hours"};
        String[] links = {
            "https://wikipedia.org/wiki/" + topic.replace(" ", "_"),
            "https://example.com",
            "https://github.com",
            "https://scholar.google.com"
        };

        for (int i = 0; i < 4; i++) {
            Map<String, Object> m = new HashMap<>();
            m.put("title", titles[i]);
            m.put("description", descs[i]);
            m.put("duration", dur[i]);
            m.put("videoUrl", "");
            m.put("pdfUrl", "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf");
            m.put("pptUrl", "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf");
            m.put("externalLinks", links[i]);
            modules.add(m);
        }
        result.put("modules", modules);

        java.util.List<Map<String, Object>> quizzes = new java.util.ArrayList<>();
        String[] qs = {
            "What is the main objective of implementing " + topic + "?",
            "Which of the following is a primary challenge in " + topic + " adoption?",
            "How does " + topic + " align with Outcome-Based Education (OBE)?",
            "What is the recommended starting point for a pilot implementation of " + topic + "?"
        };
        String[] optAs = {"To automate workflows and improve efficiency", "High scalability and zero overhead", "By mapping technical achievements to course outcomes", "Deploying globally to all courses simultaneously"};
        String[] optBs = {"To completely replace faculty members", "Data privacy and integration complexity", "By removing grades entirely", "Starting with a single section, gathering feedback, and iterating"};
        String[] optCs = {"To increase hardware requirements", "Lack of internet connections in universities", "By adding random questions to exams", "Skipping testing and writing direct production code"};
        String[] optDs = {"None of the above", "Difficulty in naming files", "It has no alignment", "Shutting down the server"};
        String[] ans = {"To automate workflows and improve efficiency", "Data privacy and integration complexity", "By mapping technical achievements to course outcomes", "Starting with a single section, gathering feedback, and iterating"};

        for (int i = 0; i < 4; i++) {
            Map<String, Object> q = new HashMap<>();
            q.put("questionId", i + 1);
            q.put("question", qs[i]);
            
            java.util.List<String> optTexts = new java.util.ArrayList<>(java.util.List.of(optAs[i], optBs[i], optCs[i], optDs[i]));
            int correctAnswer = optTexts.indexOf(ans[i]);
            
            q.put("options", optTexts);
            q.put("correctAnswer", correctAnswer);
            q.put("marks", 25);
            quizzes.add(q);
        }
        result.put("quizzes", quizzes);

        java.util.List<Map<String, Object>> assignments = new java.util.ArrayList<>();
        Map<String, Object> a1 = new HashMap<>();
        a1.put("title", "Curriculum Integration Plan for " + topic);
        a1.put("description", "Write a 3-page proposal outlining how you will integrate " + topic + " into one of your department's core courses, specifying syllabus changes and learning metrics.");
        a1.put("deadline", "Week 2 Friday");
        a1.put("maxMarks", 50);
        assignments.add(a1);

        Map<String, Object> a2 = new HashMap<>();
        a2.put("title", "Hands-on Lab Demonstration of " + topic);
        a2.put("description", "Create a working sample code or layout demonstrating the deployment of a basic " + topic + " project, and record a 5-minute video walkthrough.");
        a2.put("deadline", "Week 4 Monday");
        a2.put("maxMarks", 50);
        assignments.add(a2);

        result.put("assignments", assignments);

        return result;
    }

    /**
     * Call AI microservice to suggest a video for a module topic.
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> suggestVideo(String topic) {
        try {
            log.info("Requesting video suggestion from AI service for topic: {}", topic);
            String encodedTopic = java.net.URLEncoder.encode(topic, "UTF-8");
            ResponseEntity<Map> response = restTemplate.getForEntity(
                    aiServiceUrl + "/api/ai/suggest-video?topic=" + encodedTopic, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }
        } catch (Exception e) {
            log.error("AI service video suggestion failed: {}", e.getMessage());
        }

        // Fallback in case AI service is down
        Map<String, Object> fallback = new HashMap<>();
        fallback.put("success", false);
        fallback.put("videoUrl", "");
        fallback.put("youtubeId", "");
        fallback.put("youtubeUrl", "");
        return fallback;
    }

    /**
     * Request module notes generation from Python AI service.
     */
    @SuppressWarnings("unchecked")
    public String generateModuleNotes(String moduleTitle, String fdpTitle) {
        try {
            Map<String, String> request = new HashMap<>();
            request.put("title", moduleTitle);
            request.put("fdpTitle", fdpTitle != null ? fdpTitle : "Faculty Development Program");

            ResponseEntity<Map> response = restTemplate.postForEntity(
                    aiServiceUrl + "/api/ai/generate-module-notes", request, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> body = response.getBody();
                if (body.containsKey("notes")) {
                    return (String) body.get("notes");
                }
            }
        } catch (Exception e) {
            log.warn("AI service failed to generate module notes, using fallback: {}", e.getMessage());
        }
        return generateFallbackModuleNotes(moduleTitle, fdpTitle);
    }

    private String generateFallbackModuleNotes(String title, String fdpTitle) {
        return "### Introduction to " + title + "\n" +
                "Welcome to the study note for the module **" + title + "** in the program **" + (fdpTitle != null ? fdpTitle : "Faculty Development Program") + "**.\n\n" +
                "### Core Architecture and Theoretical Frameworks\n" +
                "Implementing technologies and advanced methodologies for " + title + " requires a solid grasp of core systems engineering and software architecture. Key components include modular design, clean data schemas, and security auditing protocols.\n\n" +
                "### Classroom Use Cases and Pedagogical Alignment\n" +
                "Deploying this topic in a classroom context allows faculty to automate assessments, track learning analytics, and construct personalized study plans for students in alignment with outcome-based education (OBE).\n\n" +
                "### Key Summary\n" +
                "- Modular architecture ensures system scalability.\n" +
                "- Assessment criteria must follow institutional and NEP 2020 guidelines.";
    }
}

