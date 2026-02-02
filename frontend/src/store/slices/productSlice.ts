import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { productService } from '../../services/product.service';
import { categoryService } from '../../services/category.service';
import type { 
  ProductState, 
  Product, 
  CreateProductRequest, 
  UpdateProductRequest, 
  CreateCategoryRequest, 
  UpdateCategoryRequest, 
  ProductFilter 
} from '../../types/product.types';
import type { PaginationParams } from '../../types/api.types';

// Initial state
const initialState: ProductState = {
  products: [],
  categories: [],
  loading: false,
  error: null,
  pagination: {
    current_page: 0,
    total_pages: 0,
    total_items: 0,
    items_per_page: 20,
  },
  filters: {},
};

// Async thunks
export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async (params: PaginationParams & ProductFilter = {}, { rejectWithValue }) => {
    try {
      return await productService.getAllProducts(params);
    } catch (error: any) {
  return rejectWithValue(error.message || 'Không tải được danh sách sản phẩm');
    }
  }
);

export const fetchProductById = createAsyncThunk(
  'products/fetchProductById',
  async (id: number, { rejectWithValue }) => {
    try {
      return await productService.getProductById(id);
    } catch (error: any) {
  return rejectWithValue(error.message || 'Không tải được sản phẩm');
    }
  }
);

export const searchProducts = createAsyncThunk(
  'products/searchProducts',
  async (
    { keyword, ...params }: { keyword: string } & PaginationParams & ProductFilter,
    { rejectWithValue }
  ) => {
    try {
      return await productService.searchProducts(keyword, params);
    } catch (error: any) {
  return rejectWithValue(error.message || 'Tìm kiếm sản phẩm thất bại');
    }
  }
);

export const fetchCategories = createAsyncThunk(
  'products/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      return await categoryService.getActiveCategories();
    } catch (error: any) {
  return rejectWithValue(error.message || 'Không tải được danh mục');
    }
  }
);

export const createProduct = createAsyncThunk(
  'products/createProduct',
  async (productData: CreateProductRequest, { rejectWithValue }) => {
    try {
      return await productService.createProduct(productData);
    } catch (error: any) {
  return rejectWithValue(error.message || 'Tạo sản phẩm thất bại');
    }
  }
);

export const updateProduct = createAsyncThunk(
  'products/updateProduct',
  async (
    { id, productData }: { id: number; productData: UpdateProductRequest },
    { rejectWithValue }
  ) => {
    try {
      return await productService.updateProduct(id, productData);
    } catch (error: any) {
  return rejectWithValue(error.message || 'Cập nhật sản phẩm thất bại');
    }
  }
);

export const deleteProduct = createAsyncThunk(
  'products/deleteProduct',
  async (id: number, { rejectWithValue }) => {
    try {
      await productService.deleteProduct(id);
      return id;
    } catch (error: any) {
  return rejectWithValue(error.message || 'Xóa sản phẩm thất bại');
    }
  }
);

export const createCategory = createAsyncThunk(
  'products/createCategory',
  async (categoryData: CreateCategoryRequest, { rejectWithValue }) => {
    try {
      return await categoryService.createCategory(categoryData);
    } catch (error: any) {
  return rejectWithValue(error.message || 'Tạo danh mục thất bại');
    }
  }
);

export const updateCategory = createAsyncThunk(
  'products/updateCategory',
  async (
    { id, categoryData }: { id: number; categoryData: UpdateCategoryRequest },
    { rejectWithValue }
  ) => {
    try {
      return await categoryService.updateCategory(id, categoryData);
    } catch (error: any) {
  return rejectWithValue(error.message || 'Cập nhật danh mục thất bại');
    }
  }
);

export const deleteCategory = createAsyncThunk(
  'products/deleteCategory',
  async (id: number, { rejectWithValue }) => {
    try {
      await categoryService.deleteCategory(id);
      return id;
    } catch (error: any) {
  return rejectWithValue(error.message || 'Xóa danh mục thất bại');
    }
  }
);

// Product slice
const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },

    setFilters: (state, action: PayloadAction<ProductFilter>) => {
      state.filters = action.payload;
    },

    clearFilters: (state) => {
      state.filters = {};
    },

    setPagination: (state, action: PayloadAction<{ page: number; size?: number }>) => {
      state.pagination.current_page = action.payload.page;
      if (action.payload.size) {
        state.pagination.items_per_page = action.payload.size;
      }
    },

    // For optimistic updates
    addProductOptimistic: (state, action: PayloadAction<Product>) => {
      state.products.unshift(action.payload);
    },

    updateProductOptimistic: (state, action: PayloadAction<Product>) => {
      const index = state.products.findIndex(p => p.id === action.payload.id);
      if (index >= 0) {
        state.products[index] = action.payload;
      }
    },

    removeProductOptimistic: (state, action: PayloadAction<number>) => {
      state.products = state.products.filter(p => p.id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    // Fetch products
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload.content;
        state.pagination = {
          current_page: 1, // TODO: Backend should provide current page
          total_pages: action.payload.totalPages,
          total_items: action.payload.totalElements,
          items_per_page: action.payload.content.length, // fallback
        };
        state.error = null;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Search products
    builder
      .addCase(searchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload.content;
        state.pagination = {
          current_page: 1, // TODO: Backend should provide current page
          total_pages: action.payload.totalPages,
          total_items: action.payload.totalElements,
          items_per_page: action.payload.content.length, // fallback
        };
        state.error = null;
      })
      .addCase(searchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch categories
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = action.payload;
        state.error = null;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Create product
    builder
      .addCase(createProduct.fulfilled, (state, action) => {
        state.products.unshift(action.payload);
      });

    // Update product
    builder
      .addCase(updateProduct.fulfilled, (state, action) => {
        const index = state.products.findIndex(p => p.id === action.payload.id);
        if (index >= 0) {
          state.products[index] = action.payload;
        }
      });

    // Delete product
    builder
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.products = state.products.filter(p => p.id !== action.payload);
      });

    // Create category
    builder
      .addCase(createCategory.fulfilled, (state, action) => {
        state.categories.push(action.payload);
      });

    // Update category
    builder
      .addCase(updateCategory.fulfilled, (state, action) => {
        const index = state.categories.findIndex(c => c.id === action.payload.id);
        if (index >= 0) {
          state.categories[index] = action.payload;
        }
      });

    // Delete category
    builder
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.categories = state.categories.filter(c => c.id !== action.payload);
      });
  },
});

export const {
  clearError,
  setFilters,
  clearFilters,
  setPagination,
  addProductOptimistic,
  updateProductOptimistic,
  removeProductOptimistic,
} = productSlice.actions;

export default productSlice.reducer;
