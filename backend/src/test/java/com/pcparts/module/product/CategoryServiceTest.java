package com.pcparts.module.product;

import com.pcparts.common.exception.BusinessException;
import com.pcparts.common.exception.ResourceNotFoundException;
import com.pcparts.module.product.dto.CategoryDto;
import com.pcparts.module.product.entity.Category;
import com.pcparts.module.product.repository.CategoryRepository;
import com.pcparts.module.product.service.CategoryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CategoryServiceTest {

    @Mock private CategoryRepository categoryRepository;

    @InjectMocks
    private CategoryService categoryService;

    private Category rootCategory;
    private Category childCategory;

    @BeforeEach
    void setUp() {
        rootCategory = Category.builder().id(1L).name("Linh kiện").level(0).build();
        childCategory = Category.builder().id(2L).name("CPU").parent(rootCategory).level(1).build();
    }

    // === GET ===
    @Test
    @DisplayName("Get category tree — returns root categories with children")
    void getCategoryTree_success() {
        when(categoryRepository.findByParentIsNullOrderByNameAsc()).thenReturn(List.of(rootCategory));
        when(categoryRepository.findByParentIdOrderByNameAsc(1L)).thenReturn(List.of(childCategory));
        when(categoryRepository.findByParentIdOrderByNameAsc(2L)).thenReturn(Collections.emptyList());

        List<CategoryDto> result = categoryService.getCategoryTree();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getName()).isEqualTo("Linh kiện");
        assertThat(result.get(0).getChildren()).hasSize(1);
        assertThat(result.get(0).getChildren().get(0).getName()).isEqualTo("CPU");
    }

    @Test
    @DisplayName("Get category by ID — success")
    void getById_success() {
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(rootCategory));
        when(categoryRepository.findByParentIdOrderByNameAsc(1L)).thenReturn(Collections.emptyList());

        CategoryDto result = categoryService.getById(1L);
        assertThat(result.getName()).isEqualTo("Linh kiện");
    }

    @Test
    @DisplayName("Get category by ID — not found throws")
    void getById_notFound() {
        when(categoryRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> categoryService.getById(999L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // === CREATE ===
    @Test
    @DisplayName("Create category — root category success")
    void createCategory_root_success() {
        CategoryDto dto = CategoryDto.builder().name("GPU").description("Graphics cards").build();
        when(categoryRepository.existsByName("GPU")).thenReturn(false);
        when(categoryRepository.save(any(Category.class))).thenAnswer(inv -> {
            Category c = inv.getArgument(0); c.setId(3L); return c;
        });

        CategoryDto result = categoryService.createCategory(dto);

        assertThat(result.getName()).isEqualTo("GPU");
        verify(categoryRepository).save(any(Category.class));
    }

    @Test
    @DisplayName("Create category — child category sets parent and level")
    void createCategory_child_success() {
        CategoryDto dto = CategoryDto.builder().name("Intel CPU").parentId(1L).build();
        when(categoryRepository.existsByName("Intel CPU")).thenReturn(false);
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(rootCategory));
        when(categoryRepository.save(any(Category.class))).thenAnswer(inv -> {
            Category c = inv.getArgument(0); c.setId(4L); return c;
        });

        CategoryDto result = categoryService.createCategory(dto);

        assertThat(result.getParentId()).isEqualTo(1L);
        assertThat(result.getLevel()).isEqualTo(1);
    }

    @Test
    @DisplayName("Create category — duplicate name throws conflict")
    void createCategory_duplicate() {
        CategoryDto dto = CategoryDto.builder().name("Linh kiện").build();
        when(categoryRepository.existsByName("Linh kiện")).thenReturn(true);

        assertThatThrownBy(() -> categoryService.createCategory(dto))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("đã tồn tại");
    }

    @Test
    @DisplayName("Create category — parent not found throws")
    void createCategory_parentNotFound() {
        CategoryDto dto = CategoryDto.builder().name("New").parentId(999L).build();
        when(categoryRepository.existsByName("New")).thenReturn(false);
        when(categoryRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> categoryService.createCategory(dto))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // === UPDATE ===
    @Test
    @DisplayName("Update category — success")
    void updateCategory_success() {
        CategoryDto dto = CategoryDto.builder().name("Linh kiện máy tính").description("Updated").build();
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(rootCategory));
        when(categoryRepository.save(any(Category.class))).thenReturn(rootCategory);

        CategoryDto result = categoryService.updateCategory(1L, dto);

        assertThat(result.getName()).isEqualTo("Linh kiện máy tính");
    }

    @Test
    @DisplayName("Update category — not found throws")
    void updateCategory_notFound() {
        when(categoryRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> categoryService.updateCategory(999L, new CategoryDto()))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // === DELETE ===
    @Test
    @DisplayName("Delete category — success")
    void deleteCategory_success() {
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(rootCategory));

        categoryService.deleteCategory(1L);

        verify(categoryRepository).delete(rootCategory);
    }

    @Test
    @DisplayName("Delete category — not found throws")
    void deleteCategory_notFound() {
        when(categoryRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> categoryService.deleteCategory(999L))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
