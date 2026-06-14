package com.aifdphub.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Data
@NoArgsConstructor
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    
    @Column(columnDefinition = "TEXT")
    private String message;
    
    private String type; // e.g., USER, ENROLLMENT, QUIZ, CERTIFICATE, SYSTEM, RECOMMENDATION, ASSIGNMENT

    private String role; // ADMIN or FACULTY

    @Column(name = "user_id")
    private Long userId; // specific target user, or null if broadcast to role

    @Column(name = "college_id")
    private Long collegeId;

    private Boolean isRead = false;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (isRead == null) {
            isRead = false;
        }
    }
}
