/**
 * 🗂️ CATEGORY SERVICE - Computer Shop E-commerce
 * 
 * Service layer để handle category-related API calls
 * Supports product filtering by category
 */

import { api } from './api';
import type {
  Category,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  AttributeDefinition,
  AttributeDefinitionPayload
} from '../types/product.types';

export interface CategoryTree {
  id: number;
  name: string;
  slug: string;
  children?: CategoryTree[];
}

export const categoryService = {
  /**
   * Get all categories - GET /api/v1/categories
   */
  getCategories: async (): Promise<Category[]> => {
    try {
  console.log('🗂️ Category Service: Đang lấy danh sách danh mục...');
  const response = await api.get<Category[]>('/categories');

  console.log('✅ Category Service: Đã lấy danh sách danh mục thành công');
  return response.data;
    } catch (error: any) {
  console.error('❌ Category Service: Lỗi lấy danh mục:', error);
      if (error.response?.data) {
        throw new Error(error.response.data.message || 'Failed to get categories');
      }
      throw error;
    }
  },

  /**
   * Get category-specific filter schema (attribute definitions)
   * GET /api/v1/categories/{id}/filters
   */
  getCategoryFilters: async (categoryId: number): Promise<AttributeDefinition[]> => {
    try {
      const response = await api.get<AttributeDefinition[]>(`/categories/${categoryId}/filters`);
      return response.data;
    } catch (error: any) {
      console.error('❌ Category Service: Lỗi lấy bộ lọc danh mục:', error);
      if (error.response?.data) {
        throw new Error(error.response.data.message || 'Failed to get category filters');
      }
      throw error;
    }
  },
  /**
   * Create new attribute definition for a category - POST /api/v1/categories/{id}/attributes
   */
  createCategoryAttribute: async (categoryId: number, payload: AttributeDefinitionPayload): Promise<AttributeDefinition> => {
    try {
      const response = await api.post<AttributeDefinition>(`/categories/${categoryId}/attributes`, payload);
      return response.data;
    } catch (error: any) {
      console.error('❌ Category Service: Lỗi tạo thuộc tính danh mục:', error);
      if (error.response?.data) {
        throw new Error(error.response.data.message || 'Failed to create attribute');
      }
      throw error;
    }
  },

  /**
   * Update attribute definition - PUT /api/v1/categories/{categoryId}/attributes/{attributeId}
   */
  updateCategoryAttribute: async (
    categoryId: number,
    attributeId: number,
    payload: AttributeDefinitionPayload
  ): Promise<AttributeDefinition> => {
    try {
      const response = await api.put<AttributeDefinition>(`/categories/${categoryId}/attributes/${attributeId}`, payload);
      return response.data;
    } catch (error: any) {
      console.error('❌ Category Service: Lỗi cập nhật thuộc tính danh mục:', error);
      if (error.response?.data) {
        throw new Error(error.response.data.message || 'Failed to update attribute');
      }
      throw error;
    }
  },

  /**
   * Delete attribute definition - DELETE /api/v1/categories/{categoryId}/attributes/{attributeId}
   */
  deleteCategoryAttribute: async (categoryId: number, attributeId: number): Promise<void> => {
    try {
      await api.delete<void>(`/categories/${categoryId}/attributes/${attributeId}`);
    } catch (error: any) {
      console.error('❌ Category Service: Lỗi xóa thuộc tính danh mục:', error);
      if (error.response?.data) {
        throw new Error(error.response.data.message || 'Failed to delete attribute');
      }
      throw error;
    }
  },

  /**
   * Get category tree structure - GET /api/v1/categories/tree
   */
  getCategoryTree: async (): Promise<CategoryTree[]> => {
    try {
  console.log('🗂️ Category Service: Đang lấy cây danh mục...');
  const response = await api.get<CategoryTree[]>('/categories/tree');

  console.log('✅ Category Service: Đã lấy cây danh mục thành công');
  return response.data;
    } catch (error: any) {
  console.error('❌ Category Service: Lỗi lấy cây danh mục:', error);
      if (error.response?.data) {
        throw new Error(error.response.data.message || 'Failed to get category tree');
      }
      throw error;
    }
  },

  /**
   * Get category by ID - GET /api/v1/categories/{id}
   */
  getCategoryById: async (id: number): Promise<Category> => {
    try {
  console.log(`🗂️ Category Service: Đang lấy danh mục ${id}...`);
  const response = await api.get<Category>(`/categories/${id}`);

  console.log('✅ Category Service: Đã lấy danh mục thành công');
  return response.data;
    } catch (error: any) {
  console.error('❌ Category Service: Lỗi lấy danh mục:', error);
      if (error.response?.data) {
        throw new Error(error.response.data.message || 'Failed to get category');
      }
      throw error;
    }
  },

  /**
   * Get active categories only - GET /api/v1/categories
   * The backend's main categories endpoint already returns only active categories
   */
  getActiveCategories: async (): Promise<Category[]> => {
    try {
      console.log('🗂️ Category Service: Đang lấy danh mục đang hoạt động...');
      const response = await api.get<Category[]>('/categories');
      console.log('✅ Category Service: Đã lấy danh mục đang hoạt động thành công');
      return response.data;
    } catch (error: any) {
      console.error('❌ Category Service: Lỗi lấy danh mục đang hoạt động:', error);
      if (error.response?.data) {
        throw new Error(error.response.data.message || 'Failed to get active categories');
      }
      throw error;
    }
  },

  /**
   * Get sub-categories by parent - GET /api/v1/categories/parent/{parentId}
   */
  getSubCategories: async (parentId: number): Promise<Category[]> => {
    try {
  console.log(`🗂️ Category Service: Đang lấy danh mục con của ${parentId}...`);
  const response = await api.get<Category[]>(`/categories/parent/${parentId}`);

  console.log('✅ Category Service: Đã lấy danh mục con thành công');
  return response.data;
    } catch (error: any) {
  console.error('❌ Category Service: Lỗi lấy danh mục con:', error);
      if (error.response?.data) {
        throw new Error(error.response.data.message || 'Failed to get sub-categories');
      }
      throw error;
    }
  },
  createCategory: async (categoryData: CreateCategoryRequest): Promise<Category> => {
    try {
  console.log('🗂️ Category Service: Đang tạo danh mục...');
  const response = await api.post<Category>('/categories', categoryData);

  console.log('✅ Category Service: Đã tạo danh mục thành công');
  return response.data;
    } catch (error: any) {
  console.error('❌ Category Service: Lỗi tạo danh mục:', error);
      if (error.response?.data) {
        throw new Error(error.response.data.message || 'Failed to create category');
      }
      throw error;
    }
  },

  /**
   * Update category - PUT /api/v1/categories/{id}
   */
  updateCategory: async (id: number, categoryData: UpdateCategoryRequest): Promise<Category> => {
    try {
  console.log(`🗂️ Category Service: Đang cập nhật danh mục ${id}...`);
  const response = await api.put<Category>(`/categories/${id}`, categoryData);

  console.log('✅ Category Service: Đã cập nhật danh mục thành công');
  return response.data;
    } catch (error: any) {
  console.error('❌ Category Service: Lỗi cập nhật danh mục:', error);
      if (error.response?.data) {
        throw new Error(error.response.data.message || 'Failed to update category');
      }
      throw error;
    }
  },

  /**
   * Delete category - DELETE /api/v1/categories/{id}
   */
  deleteCategory: async (id: number): Promise<void> => {
    try {
  console.log(`🗂️ Category Service: Đang xóa danh mục ${id}...`);
  await api.delete<void>(`/categories/${id}`);

  console.log('✅ Category Service: Đã xóa danh mục thành công');
    } catch (error: any) {
  console.error('❌ Category Service: Lỗi xóa danh mục:', error);
      if (error.response?.data) {
        throw new Error(error.response.data.message || 'Failed to delete category');
      }
      throw error;
    }
  },

  /**
   * Build category hierarchy from flat list
   */
  buildCategoryHierarchy: (categories: Category[]): CategoryTree[] => {
    const categoryMap = new Map<number, CategoryTree>();
    const rootCategories: CategoryTree[] = [];

    // First pass: create all category objects
    categories.forEach(category => {
      categoryMap.set(category.id!, {
        id: category.id!,
        name: category.name,
        slug: category.slug || category.name.toLowerCase().replace(/\s+/g, '-'),
        children: []
      });
    });

    // Second pass: build hierarchy
    categories.forEach(category => {
      const categoryTree = categoryMap.get(category.id!)!;
      
      if (category.parent_category_id && categoryMap.has(category.parent_category_id)) {
        const parent = categoryMap.get(category.parent_category_id)!;
        if (!parent.children) {
          parent.children = [];
        }
        parent.children.push(categoryTree);
      } else {
        rootCategories.push(categoryTree);
      }
    });

    return rootCategories;
  }
};
