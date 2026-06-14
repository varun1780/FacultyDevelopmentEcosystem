package com.aifdphub.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "certificates")
@Data
@NoArgsConstructor
public class Certificate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String certificateId;

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

    @Column(nullable = false)
    private String certificateHash;

    private String txHash;
    private String ipfsHash;
    private String ipfsUrl;
    private Boolean isOnChain = false;
    private Boolean isValid = true;
    
    private String status = "ISSUED";
    private String verificationCode;
    
    @Column(columnDefinition = "TEXT")
    private String certificateUrl;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String templateSettings; // Snapshot of styles, texts, logos, signatures when generated

    private LocalDateTime issuedAt;

    @PrePersist
    protected void onCreate() {
        issuedAt = LocalDateTime.now();
    }
}
