package com.aifdphub.controller;

import com.aifdphub.model.User;
import com.aifdphub.repository.UserRepository;
import com.aifdphub.security.JwtTokenProvider;
import com.aifdphub.service.NotificationService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*", maxAge = 3600)
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final NotificationService notificationService;

    public AuthController(UserRepository userRepository,
                          PasswordEncoder passwordEncoder,
                          JwtTokenProvider jwtTokenProvider,
                          NotificationService notificationService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
        this.notificationService = notificationService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody User user) {
        if (userRepository.existsByEmail(user.getEmail())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email is already in use!"));
        }

        // Hash password before storing
        user.setPassword(passwordEncoder.encode(user.getPassword()));

        // Default role
        if (user.getRole() == null || user.getRole().isEmpty()) {
            user.setRole("FACULTY");
        }

        User savedUser = userRepository.save(user);
        String token = jwtTokenProvider.generateToken(savedUser.getId(), savedUser.getEmail(), savedUser.getRole());

        if ("FACULTY".equals(savedUser.getRole())) {
            notificationService.createNotification(
                "New Faculty Registered",
                "Faculty member " + savedUser.getName() + " (" + savedUser.getEmail() + ") has registered.",
                "USER",
                "ADMIN",
                null
            );
        }

        Map<String, Object> response = new HashMap<>();
        response.put("message", "User registered successfully!");
        response.put("user", sanitizeUser(savedUser));
        response.put("token", token);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@RequestBody Map<String, String> loginRequest) {
        String email = loginRequest.get("email");
        String password = loginRequest.get("password");

        if (email == null || password == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email and password are required"));
        }

        Optional<User> optionalUser = userRepository.findByEmail(email);

        if (optionalUser.isPresent()) {
            User user = optionalUser.get();
            if (passwordEncoder.matches(password, user.getPassword())) {
                String token = jwtTokenProvider.generateToken(user.getId(), user.getEmail(), user.getRole());

                Map<String, Object> response = new HashMap<>();
                response.put("token", token);
                response.put("user", sanitizeUser(user));
                return ResponseEntity.ok(response);
            }
        }

        return ResponseEntity.status(401).body(Map.of("error", "Invalid email or password"));
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }

        String token = authHeader.substring(7);
        if (!jwtTokenProvider.validateToken(token)) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid token"));
        }

        Long userId = jwtTokenProvider.getUserIdFromToken(token);
        Optional<User> userOpt = userRepository.findById(userId);

        return userOpt.map(user -> ResponseEntity.ok(sanitizeUser(user)))
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Remove password from user response
     */
    private Map<String, Object> sanitizeUser(User user) {
        Map<String, Object> sanitized = new HashMap<>();
        sanitized.put("id", user.getId());
        sanitized.put("name", user.getName());
        sanitized.put("email", user.getEmail());
        sanitized.put("role", user.getRole());
        sanitized.put("department", user.getDepartment());
        sanitized.put("designation", user.getDesignation());
        sanitized.put("experience", user.getExperience());
        sanitized.put("skills", user.getSkills());
        sanitized.put("interests", user.getInterests());
        sanitized.put("phone", user.getPhone());
        sanitized.put("linkedinUrl", user.getLinkedinUrl());
        sanitized.put("bio", user.getBio());
        sanitized.put("institutionName", user.getInstitutionName());
        sanitized.put("profilePhoto", user.getProfilePhoto());
        sanitized.put("coverBanner", user.getCoverBanner());
        sanitized.put("twoFactorEnabled", user.getTwoFactorEnabled() != null && user.getTwoFactorEnabled());
        sanitized.put("createdAt", user.getCreatedAt());
        return sanitized;
    }
}
