package com.aifdphub.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "quiz_results")
@Data
@NoArgsConstructor
public class QuizResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "faculty_id", nullable = false)
    private Long facultyId;

    @Column(name = "fdp_id", nullable = false)
    private Long fdpId;

    @Column(columnDefinition = "TEXT")
    private String answers;

    private Double score = 0.0;
    private Boolean passed = false;
    private LocalDateTime completedAt = LocalDateTime.now();
}
