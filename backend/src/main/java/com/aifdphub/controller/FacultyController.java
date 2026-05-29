package com.aifdphub.controller;

import com.aifdphub.model.User;
import com.aifdphub.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/faculty")
@CrossOrigin(origins = "*")
public class FacultyController {

    private final UserRepository userRepository;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    public FacultyController(UserRepository userRepository, org.springframework.security.crypto.password.PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping("/all")
    public ResponseEntity<?> getAllFaculty() {
        List<User> faculty = userRepository.findByRole("FACULTY");
        List<Map<String, Object>> sanitized = faculty.stream().map(u -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", u.getId());
            m.put("name", u.getName());
            m.put("email", u.getEmail());
            m.put("department", u.getDepartment());
            m.put("designation", u.getDesignation());
            m.put("experience", u.getExperience());
            return m;
        }).toList();
        return ResponseEntity.ok(sanitized);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getFacultyById(@PathVariable Long id) {
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isPresent()) {
            User u = userOpt.get();
            Map<String, Object> m = new HashMap<>();
            m.put("id", u.getId());
            m.put("name", u.getName());
            m.put("email", u.getEmail());
            m.put("role", u.getRole());
            m.put("department", u.getDepartment());
            m.put("designation", u.getDesignation());
            m.put("experience", u.getExperience());
            m.put("skills", u.getSkills());
            m.put("interests", u.getInterests());
            m.put("phone", u.getPhone());
            m.put("linkedinUrl", u.getLinkedinUrl());
            m.put("bio", u.getBio());
            m.put("institutionName", u.getInstitutionName());
            m.put("profilePhoto", u.getProfilePhoto());
            m.put("coverBanner", u.getCoverBanner());
            m.put("twoFactorEnabled", u.getTwoFactorEnabled() != null && u.getTwoFactorEnabled());
            return ResponseEntity.ok(m);
        }
        return ResponseEntity.notFound().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateFaculty(@PathVariable Long id, @RequestBody Map<String, Object> updates) {
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (updates.containsKey("name")) user.setName((String) updates.get("name"));
            if (updates.containsKey("department")) user.setDepartment((String) updates.get("department"));
            if (updates.containsKey("designation")) user.setDesignation((String) updates.get("designation"));
            if (updates.containsKey("experience")) {
                Object exp = updates.get("experience");
                if (exp instanceof Integer) {
                    user.setExperience((Integer) exp);
                } else if (exp instanceof String) {
                    try {
                        user.setExperience(Integer.parseInt((String) exp));
                    } catch (NumberFormatException e) { }
                }
            }
            if (updates.containsKey("phone")) user.setPhone((String) updates.get("phone"));
            if (updates.containsKey("linkedinUrl")) user.setLinkedinUrl((String) updates.get("linkedinUrl"));
            if (updates.containsKey("bio")) user.setBio((String) updates.get("bio"));
            if (updates.containsKey("institutionName")) user.setInstitutionName((String) updates.get("institutionName"));
            if (updates.containsKey("profilePhoto")) user.setProfilePhoto((String) updates.get("profilePhoto"));
            if (updates.containsKey("coverBanner")) user.setCoverBanner((String) updates.get("coverBanner"));
            if (updates.containsKey("twoFactorEnabled")) user.setTwoFactorEnabled((Boolean) updates.get("twoFactorEnabled"));
            
            if (updates.containsKey("skills")) {
                try {
                    Map<String, Object> skillsRaw = (Map<String, Object>) updates.get("skills");
                    Map<String, Integer> skillsParsed = new HashMap<>();
                    for (Map.Entry<String, Object> entry : skillsRaw.entrySet()) {
                        if (entry.getValue() instanceof Number) {
                            skillsParsed.put(entry.getKey(), ((Number) entry.getValue()).intValue());
                        } else if (entry.getValue() instanceof String) {
                            try {
                                skillsParsed.put(entry.getKey(), Integer.parseInt((String) entry.getValue()));
                            } catch (NumberFormatException e) { }
                        }
                    }
                    user.setSkills(skillsParsed);
                } catch (Exception e) { }
            }

            User saved = userRepository.save(user);
            
            // Return updated user object
            Map<String, Object> sanitized = new HashMap<>();
            sanitized.put("id", saved.getId());
            sanitized.put("name", saved.getName());
            sanitized.put("email", saved.getEmail());
            sanitized.put("role", saved.getRole());
            sanitized.put("department", saved.getDepartment());
            sanitized.put("designation", saved.getDesignation());
            sanitized.put("experience", saved.getExperience());
            sanitized.put("skills", saved.getSkills());
            sanitized.put("interests", saved.getInterests());
            sanitized.put("phone", saved.getPhone());
            sanitized.put("linkedinUrl", saved.getLinkedinUrl());
            sanitized.put("bio", saved.getBio());
            sanitized.put("institutionName", saved.getInstitutionName());
            sanitized.put("profilePhoto", saved.getProfilePhoto());
            sanitized.put("coverBanner", saved.getCoverBanner());
            sanitized.put("twoFactorEnabled", saved.getTwoFactorEnabled() != null && saved.getTwoFactorEnabled());
            
            return ResponseEntity.ok(Map.of("message", "Profile updated", "user", sanitized));
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/{id}/change-password")
    public ResponseEntity<?> changePassword(@PathVariable Long id, @RequestBody Map<String, String> request) {
        String currentPassword = request.get("currentPassword");
        String newPassword = request.get("newPassword");
        
        if (currentPassword == null || newPassword == null || currentPassword.isBlank() || newPassword.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Current password and new password are required"));
        }
        
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
                return ResponseEntity.badRequest().body(Map.of("error", "Current password does not match"));
            }
            
            user.setPassword(passwordEncoder.encode(newPassword));
            userRepository.save(user);
            return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
        }
        return ResponseEntity.notFound().build();
    }
}
