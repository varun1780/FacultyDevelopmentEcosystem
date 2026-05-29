package com.aifdphub.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.List;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Name is required")
    @Column(nullable = false)
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    @Column(nullable = false, unique = true)
    private String email;

    @com.fasterxml.jackson.annotation.JsonProperty(access = com.fasterxml.jackson.annotation.JsonProperty.Access.WRITE_ONLY)
    @NotBlank(message = "Password is required")
    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String role = "FACULTY"; // ADMIN or FACULTY

    @Column(nullable = false)
    private String status = "ACTIVE"; // ACTIVE or INACTIVE

    private String department;
    private String designation;
    private Integer experience;
    
    private String phone;
    private String linkedinUrl;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String bio;

    private String institutionName;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String profilePhoto;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String coverBanner;

    private Boolean twoFactorEnabled = false;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_skills", joinColumns = @JoinColumn(name = "user_id"))
    @MapKeyColumn(name = "skill_name")
    @Column(name = "skill_score")
    private Map<String, Integer> skills;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_interests", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "interest")
    private List<String> interests;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
