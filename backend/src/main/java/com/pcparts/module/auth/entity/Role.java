package com.pcparts.module.auth.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Role entity — defines user roles (ADMIN, SALES, WAREHOUSE, CUSTOMER).
 */
@Entity
@Table(name = "role")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Role {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 50)
    private String name;

    @Column(length = 255)
    private String description;
}
