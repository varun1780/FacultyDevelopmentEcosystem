package com.aifdphub.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "enrollments")
@Data
@NoArgsConstructor
public class Enrollment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "fdp_id", nullable = false)
    @org.hibernate.annotations.OnDelete(action = org.hibernate.annotations.OnDeleteAction.CASCADE)
    private FdpProgram fdpProgram;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "college_id")
    private College college;

    private Integer progressPercentage = 0;
    private Integer completedModules = 0;
    private Double quizScore = 0.0;
    private Integer quizAttempts = 0;
    private Boolean assignmentSubmitted = false;
    private Double assignmentScore = 0.0;
    private Boolean isCompleted = false;
    
    private String completionStatus = "IN_PROGRESS";
    private Boolean certificateGenerated = false;

    @Column(columnDefinition = "TEXT")
    private String quizAnswers; // JSON of submitted answers

    @Column(columnDefinition = "TEXT")
    private String aiFeedback; // AI evaluation feedback

    private LocalDateTime enrolledAt;
    private LocalDateTime completedAt;

    @PrePersist
    protected void onCreate() {
        enrolledAt = LocalDateTime.now();
    }

    // Convenience accessors for analytics
    public String getStatus() {
        return isCompleted != null && isCompleted ? "Completed" : "In Progress";
    }

    public Long getFacultyId() {
        return user != null ? user.getId() : null;
    }

    public Long getFdpId() {
        return fdpProgram != null ? fdpProgram.getId() : null;
    }
}
