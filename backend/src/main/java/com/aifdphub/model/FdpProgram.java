package com.aifdphub.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "fdp_programs")
@Data
@NoArgsConstructor
public class FdpProgram {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Title is required")
    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String category;
    private String duration;
    private String difficultyLevel;
    private String instructorName;

    private LocalDate startDate;
    private LocalDate endDate;

    private Integer maxSeats;
    private Integer enrolledCount = 0;

    @Column(columnDefinition = "TEXT")
    private String learningOutcomes;

    @Column(columnDefinition = "TEXT")
    private String prerequisites;

    @Column(columnDefinition = "TEXT")
    private String completionCriteria;

    private String status = "Upcoming"; // Active, Upcoming, Completed

    @Column(columnDefinition = "TEXT")
    private String modules; // JSON array of module objects

    @Column(columnDefinition = "TEXT")
    private String quiz; // JSON quiz structure

    @Column(columnDefinition = "TEXT")
    private String assignment; // JSON assignment structure

    private Double passingScore = 60.0;

    private String thumbnailUrl;
    private Boolean enableCertificate = true;
    private Boolean enableBlockchain = false;
    private String certificateTemplate = "Classic";
    private Boolean isPrivate = false;
    private LocalDate enrollmentDeadline;
    private Integer maxAttempts = 3;

    @Column(columnDefinition = "TEXT")
    private String recommendedResources;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Transient
    private String mode;
}
