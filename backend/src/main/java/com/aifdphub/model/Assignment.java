package com.aifdphub.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "assignments")
@Data
@NoArgsConstructor
public class Assignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fdp_id", nullable = false)
    private FdpProgram fdpProgram;

    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String deadline;
    private Integer maxMarks = 100;
}
