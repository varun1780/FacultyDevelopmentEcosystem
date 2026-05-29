package com.aifdphub.controller;

import com.aifdphub.model.Notification;
import com.aifdphub.model.User;
import com.aifdphub.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "*")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    private User getAuthenticatedUser(Authentication auth) {
        if (auth == null || auth.getPrincipal() == null) return null;
        if (auth.getPrincipal() instanceof User) {
            return (User) auth.getPrincipal();
        }
        return null;
    }

    @GetMapping
    public ResponseEntity<?> getNotifications(Authentication auth) {
        User user = getAuthenticatedUser(auth);
        if (user == null) return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));

        List<Notification> notifications = notificationService.getNotificationsForUser(user.getId(), user.getRole());
        return ResponseEntity.ok(notifications);
    }

    @PostMapping
    public ResponseEntity<?> createNotification(@RequestBody Map<String, Object> payload) {
        String title = (String) payload.get("title");
        String message = (String) payload.get("message");
        String type = (String) payload.get("type");
        String role = (String) payload.get("role");
        Long userId = payload.get("userId") != null ? Long.valueOf(payload.get("userId").toString()) : null;

        if (title == null || title.isBlank() || message == null || message.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Title and message are required"));
        }

        Notification notification = notificationService.createNotification(title, message, type, role, userId);
        return ResponseEntity.ok(notification);
    }

    @PutMapping("/read/{id}")
    public ResponseEntity<?> markAsRead(@PathVariable Long id, Authentication auth) {
        User user = getAuthenticatedUser(auth);
        if (user == null) return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));

        Notification updated = notificationService.markAsRead(id);
        if (updated == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/read/all")
    public ResponseEntity<?> markAllAsRead(Authentication auth) {
        User user = getAuthenticatedUser(auth);
        if (user == null) return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));

        notificationService.markAllAsRead(user.getId(), user.getRole());
        return ResponseEntity.ok(Map.of("message", "All notifications marked as read"));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<?> markAsReadPatch(@PathVariable Long id, Authentication auth) {
        return markAsRead(id, auth);
    }

    @PatchMapping("/read-all")
    public ResponseEntity<?> markAllAsReadPatch(Authentication auth) {
        return markAllAsRead(auth);
    }
}
