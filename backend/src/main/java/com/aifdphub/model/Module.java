package com.aifdphub.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "modules")
@Data
@NoArgsConstructor
public class Module {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fdp_id", nullable = false)
    private FdpProgram fdpProgram;

    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String videoUrl;
    private String videoType;
    private String youtubeId;
    private String uploadedFilePath;
    private String pdfUrl;
    private String pptUrl;

    @Column(columnDefinition = "TEXT")
    private String externalLinks;

    private String duration;
}
