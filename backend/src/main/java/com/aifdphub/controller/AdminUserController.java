package com.aifdphub.controller;

import com.aifdphub.model.User;
import com.aifdphub.repository.UserRepository;
import com.aifdphub.repository.EnrollmentRepository;
import com.aifdphub.repository.CertificateRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/users")
@CrossOrigin(origins = "*")
public class AdminUserController {

    private final UserRepository userRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final CertificateRepository certificateRepository;

    public AdminUserController(UserRepository userRepository, EnrollmentRepository enrollmentRepository, CertificateRepository certificateRepository) {
        this.userRepository = userRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.certificateRepository = certificateRepository;
    }

    private boolean isAdmin(Authentication auth) {
        return auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_SUPER_ADMIN"));
    }

    private boolean isSuperAdmin(Authentication auth) {
        return auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_SUPER_ADMIN"));
    }

    private User getAuthenticatedUser(Authentication auth) {
        if (auth != null && auth.getPrincipal() instanceof User) {
            return (User) auth.getPrincipal();
        }
        return null;
    }

    private boolean canManageUser(User admin, User targetUser, boolean isSuperAdmin) {
        if (isSuperAdmin) return true;
        if (admin.getCollege() == null || targetUser.getCollege() == null) return false;
        return admin.getCollege().getId().equals(targetUser.getCollege().getId());
    }

    @GetMapping
    public ResponseEntity<?> getAllUsers(Authentication auth) {
        if (!isAdmin(auth)) return ResponseEntity.status(403).build();

        User admin = getAuthenticatedUser(auth);
        boolean superAdmin = isSuperAdmin(auth);

        List<User> users;
        if (superAdmin) {
            users = userRepository.findAll();
        } else {
            Long collegeId = admin.getCollege() != null ? admin.getCollege().getId() : null;
            if (collegeId == null) return ResponseEntity.status(403).build();
            users = userRepository.findByCollegeId(collegeId);
        }

        List<Map<String, Object>> response = users.stream().map(u -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", u.getId());
            map.put("name", u.getName());
            map.put("email", u.getEmail());
            map.put("role", u.getRole());
            map.put("status", u.getStatus());
            map.put("department", u.getDepartment());
            map.put("createdAt", u.getCreatedAt());
            map.put("collegeName", u.getCollege() != null ? u.getCollege().getCollegeName() : u.getInstitutionName());
            
            // Get stats if they are faculty
            if ("FACULTY".equals(u.getRole())) {
                map.put("fdpCount", enrollmentRepository.findByUserId(u.getId()).size());
                map.put("certificateCount", certificateRepository.findByUserId(u.getId()).size());
            } else {
                map.put("fdpCount", 0);
                map.put("certificateCount", 0);
            }
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getUser(@PathVariable Long id, Authentication auth) {
        if (!isAdmin(auth)) return ResponseEntity.status(403).build();
        
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) return ResponseEntity.notFound().build();
        
        User targetUser = userOpt.get();
        if (!canManageUser(getAuthenticatedUser(auth), targetUser, isSuperAdmin(auth))) {
            return ResponseEntity.status(403).body(Map.of("error", "Unauthorized access to other institution's user"));
        }
        return ResponseEntity.ok(targetUser);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> payload, Authentication auth) {
        if (!isAdmin(auth)) return ResponseEntity.status(403).build();
        
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) return ResponseEntity.notFound().build();

        User targetUser = userOpt.get();
        if (!canManageUser(getAuthenticatedUser(auth), targetUser, isSuperAdmin(auth))) {
            return ResponseEntity.status(403).body(Map.of("error", "Unauthorized access"));
        }

        // Only SUPER_ADMIN can modify other ADMIN statuses
        if ("ADMIN".equals(targetUser.getRole()) && !isSuperAdmin(auth)) {
            return ResponseEntity.status(403).body(Map.of("error", "Only SUPER_ADMIN can manage ADMIN accounts"));
        }

        if (payload.containsKey("status")) {
            targetUser.setStatus(payload.get("status"));
            userRepository.save(targetUser);
        }
        return ResponseEntity.ok(targetUser);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id, Authentication auth) {
        if (!isAdmin(auth)) return ResponseEntity.status(403).build();
        
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) return ResponseEntity.notFound().build();

        User targetUser = userOpt.get();
        if (!canManageUser(getAuthenticatedUser(auth), targetUser, isSuperAdmin(auth))) {
            return ResponseEntity.status(403).body(Map.of("error", "Unauthorized access"));
        }

        if ("ADMIN".equals(targetUser.getRole()) && !isSuperAdmin(auth)) {
            return ResponseEntity.status(403).body(Map.of("error", "Only SUPER_ADMIN can delete ADMIN accounts"));
        }

        userRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
