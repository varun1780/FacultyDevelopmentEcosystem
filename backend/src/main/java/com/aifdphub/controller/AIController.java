package com.aifdphub.controller;

import com.aifdphub.service.AIService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = "*")
public class AIController {

    private final AIService aiService;

    public AIController(AIService aiService) {
        this.aiService = aiService;
    }

    @PostMapping("/generate-content")
    public ResponseEntity<?> generateContent(@RequestBody Map<String, String> request) {
        String topic = request.get("topic");
        String level = request.get("level");
        String duration = request.get("duration");

        if (topic == null || topic.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Topic is required"));
        }

        return ResponseEntity.ok(aiService.generateContent(topic, level, duration));
    }

    @PostMapping("/generate-quiz")
    public ResponseEntity<?> generateQuiz(@RequestBody Map<String, Object> request) {
        String topic = (String) request.get("topic");
        int count = request.containsKey("questionCount")
                ? ((Number) request.get("questionCount")).intValue() : 5;

        if (topic == null || topic.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Topic is required"));
        }

        return ResponseEntity.ok(aiService.generateQuiz(topic, count));
    }

    @PostMapping("/evaluate")
    public ResponseEntity<?> evaluateAnswer(@RequestBody Map<String, Object> request) {
        String topic = (String) request.get("topic");
        Object answers = request.get("answers");
        Object correctAnswers = request.get("correctAnswers");

        return ResponseEntity.ok(aiService.evaluateAnswers(topic, answers, correctAnswers));
    }

    @PostMapping("/recommend")
    public ResponseEntity<?> recommendFdp(@RequestBody(required = false) Map<String, Object> request) {
        Object skills = request != null ? request.get("skills") : null;
        Object interests = request != null ? request.get("interests") : null;
        Object completed = request != null ? request.get("completedFdps") : null;

        return ResponseEntity.ok(aiService.getRecommendations(skills, interests, completed));
    }

    @PostMapping("/skill-gap")
    public ResponseEntity<?> skillGap(@RequestBody(required = false) Map<String, Object> request) {
        Object skills = request != null ? request.get("skills") : null;
        Object targetSkills = request != null ? request.get("targetSkills") : null;

        return ResponseEntity.ok(aiService.analyzeSkillGap(skills, targetSkills));
    }

    @PostMapping("/chatbot")
    public ResponseEntity<?> chatbot(@RequestBody Map<String, String> request) {
        String message = request.get("message");
        String context = request.get("context");

        if (message == null || message.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Message is required"));
        }

        return ResponseEntity.ok(aiService.chat(message, context));
    }
}
