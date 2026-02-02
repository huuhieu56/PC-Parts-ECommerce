package com.computershop.entity;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "attribute_definitions",
        uniqueConstraints = @UniqueConstraint(columnNames = {"category_id", "code"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttributeDefinition extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "attributes_seq")
    @SequenceGenerator(name = "attributes_seq", sequenceName = "attributes_seq", allocationSize = 1)
    private Long id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @NotBlank
    @Column(name = "code", nullable = false, length = 100)
    private String code;

    @NotBlank
    @Column(name = "display_name", nullable = false, length = 200)
    private String displayName;

    @NotBlank
    @Column(name = "data_type", nullable = false, length = 20)
    private String dataType; // Loại dữ liệu: string | number | boolean | enum

    @NotBlank
    @Column(name = "input_type", nullable = false, length = 30)
    private String inputType; // Kiểu nhập: select | multi_select | range | checkbox

    @Column(name = "unit", length = 50)
    private String unit;

    @Column(name = "sort_order")
    private Integer sortOrder;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "options", columnDefinition = "jsonb")
    private JsonNode options; // Dành cho enum hoặc giá trị định nghĩa sẵn

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;
}
