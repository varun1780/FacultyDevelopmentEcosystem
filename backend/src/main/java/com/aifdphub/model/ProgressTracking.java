package com.aifdphub.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "progress_tracking")
@Data
@NoArgsConstructor
public class ProgressTracking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fdp_id", nullable = false)
    private FdpProgram fdpProgram;

    private Integer progressPercentage = 0;
    private Integer completedModulesCount = 0;
    private LocalDateTime lastAccessedAt = LocalDateTime.now();
}
