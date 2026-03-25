package com.pcparts.module.inventory.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Supplier entity — DB: contact_person, phone, email, address.
 */
@Entity
@Table(name = "supplier")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Supplier {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(name = "contact_person")
    private String contactPerson;

    @Column(length = 20)
    private String phone;

    private String email;

    @Column(columnDefinition = "TEXT")
    private String address;
}
