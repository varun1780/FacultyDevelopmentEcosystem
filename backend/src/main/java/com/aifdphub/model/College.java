package com.aifdphub.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "colleges")
@Data
@NoArgsConstructor
public class College {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "College Name is required")
    @Column(nullable = false)
    private String collegeName;

    @NotBlank(message = "College Code is required")
    @Column(nullable = false, unique = true)
    private String collegeCode;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String logo;

    private String department;
    
    @Column(columnDefinition = "TEXT")
    private String address;
    
    private String website;

    private String principalName;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String principalSignature;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String hodSignature;

    @Column(columnDefinition = "TEXT")
    private String certificateTemplate;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
