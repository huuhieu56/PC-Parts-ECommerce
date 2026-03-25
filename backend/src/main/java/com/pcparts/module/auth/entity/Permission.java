package com.pcparts.module.auth.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Permission entity — granular permissions like product.create, order.update.
 */
@Entity
@Table(name = "permission")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Permission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 100)
    private String code;

    @Column(length = 255)
    private String description;
}
