package com.aifdphub.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "certificate_templates")
@Data
@NoArgsConstructor
public class CertificateTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "fdp_id", unique = true)
    private Long fdpId;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String logo;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String signatures; // JSON string of signatures: {principal, hod, coordinator}

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String colors; // JSON string or text: {primary, secondary, text}

    private String title;
    private String borderStyle;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String backgroundImage;

    private String institutionName;
    private String institutionSubtitle;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String descriptionText;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
