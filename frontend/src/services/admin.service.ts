import { userService } from './user.service';
import { productService } from './product.service';
import { orderService } from './order.service';
import { inventoryService } from './inventory.service';
import { promotionService } from './promotion.service';

export interface DashboardStats {
  totalProducts: number;
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  lowStockProducts: number;
  pendingOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  activePromotions: number;
  recentComments: number;
}

export interface RecentActivity {
  id: string;
  type: 'order' | 'user' | 'product' | 'comment';
  message: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error' | 'info';
}

export const adminDashboardService = {
  /**
   * Get comprehensive dashboard statistics
   */
  getDashboardStats: async (): Promise<DashboardStats> => {
    try {
      console.log('📊 Admin Dashboard: Đang lấy thống kê tổng quan...');
      
      // Lấy số lượng sản phẩm & người dùng từ các service chuyên trách
      const [productsRes, usersRes, lowStockRes, promotionsRes] = await Promise.allSettled([
        productService.getProductCount(),
        userService.getUserCount(),
        inventoryService.getLowStock(10).catch(() => []),
        promotionService.getActivePromotions().catch(() => [])
      ]);

      const totalProducts = productsRes.status === 'fulfilled' ? Number(productsRes.value ?? 0) : 0;
      const totalUsers = usersRes.status === 'fulfilled' ? Number(usersRes.value ?? 0) : 0;

      // Lấy tổng số đơn hàng từ /orders (page size 1 để lấy totalElements) vì không có endpoint /orders/stats trên backend
      let totalOrders = 0;
      try {
        const pg = await orderService.getOrders({ page: 0, size: 1 });
        totalOrders = Number(pg.totalElements || 0);
      } catch (e) {
        console.warn('Dashboard: không lấy được tổng đơn hàng', e);
      }
      
      // Calculate low stock products
      let lowStockProducts = 0;
      if (lowStockRes.status === 'fulfilled') {
        const lowStockData = lowStockRes.value;
        if (Array.isArray(lowStockData)) {
          lowStockProducts = lowStockData.length;
        } else if (lowStockData && typeof lowStockData === 'object' && 'products' in lowStockData) {
          lowStockProducts = lowStockData.products?.length || 0;
        }
      }

      // Calculate active promotions
      let activePromotions = 0;
      if (promotionsRes.status === 'fulfilled') {
        const promotionsData = promotionsRes.value;
        if (Array.isArray(promotionsData)) {
          activePromotions = promotionsData.length;
        }
      }

      // Thống kê chi tiết trạng thái: dùng /orders/status/{status} size=1 để lấy count nhanh
      const statusList = ['PENDING','PROCESSING','SHIPPED','DELIVERED','CANCELLED'];
      const statusCounts: Record<string, number> = {};
      await Promise.all(statusList.map(async s => {
        try {
          const pg = await orderService.getOrdersByStatus(s, { page: 0, size: 1 });
          statusCounts[s] = Number(pg.totalElements || 0);
        } catch {
          statusCounts[s] = 0;
        }
      }));

      let pendingOrders = statusCounts['PENDING'] || 0;
      let processingOrders = statusCounts['PROCESSING'] || 0;
      let shippedOrders = statusCounts['SHIPPED'] || 0;
      let deliveredOrders = statusCounts['DELIVERED'] || 0;
      let cancelledOrders = statusCounts['CANCELLED'] || 0;

      // Doanh thu: tính từ các đơn DELIVERED (final_amount ưu tiên, fallback total_amount). Lặp qua trang nếu cần.
      let totalRevenue = 0;
      try {
        const pageSize = 200;
        const firstPage = await orderService.getOrdersByStatus('DELIVERED', { page: 0, size: pageSize });
        const totalDelivered = Number(firstPage.totalElements || firstPage.content.length || 0);
        const totalPages = Math.ceil(totalDelivered / pageSize);
        const accumulate = (arr: any[]) => {
          for (const o of arr) {
            totalRevenue += Number(o.final_amount ?? o.finalAmount ?? o.total_amount ?? o.total ?? 0);
          }
        };
        accumulate(firstPage.content || []);
        // Nếu nhiều hơn 1 trang, fetch tuần tự (có thể cải tiến song song nhưng tránh quá tải server)
        for (let p = 1; p < totalPages; p++) {
          const pg = await orderService.getOrdersByStatus('DELIVERED', { page: p, size: pageSize });
          accumulate(pg.content || []);
        }
      } catch (e) {
        console.warn('Dashboard: lỗi tính doanh thu từ đơn DELIVERED', e);
      }

  const recentComments = 0; // Chưa có endpoint trả về bình luận gần đây

      const stats: DashboardStats = {
        totalProducts,
        totalUsers,
        totalOrders,
        totalRevenue,
        lowStockProducts,
        pendingOrders,
        processingOrders,
        shippedOrders,
        deliveredOrders,
        cancelledOrders,
        activePromotions,
        recentComments
      };

      console.log('✅ Admin Dashboard: Đã lấy thống kê tổng quan thành công');
      return stats;
    } catch (error: any) {
      console.error('❌ Admin Dashboard: Lỗi lấy thống kê tổng quan:', error);
      throw error;
    }
  },

  /**
   * Get recent activities (placeholder implementation)
   */
  getRecentActivities: async (limit: number = 10): Promise<RecentActivity[]> => {
    try {
      console.log('📊 Admin Dashboard: Đang lấy hoạt động gần đây...');
      
      // TODO: Implement real recent activities when backend supports it
      // For now, return mock data
      const mock: RecentActivity[] = [
        { 
          id: '1', 
          type: 'order', 
          message: 'Đơn hàng mới được tạo', 
          timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(), 
          status: 'success' 
        },
        { 
          id: '2', 
          type: 'product', 
          message: 'Sản phẩm sắp hết hàng', 
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(), 
          status: 'warning' 
        },
        { 
          id: '3', 
          type: 'user', 
          message: 'Người dùng mới đăng ký', 
          timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(), 
          status: 'info' 
        }
      ];

      return mock.slice(0, limit);
    } catch (error: any) {
      console.error('❌ Admin Dashboard: Lỗi lấy hoạt động gần đây:', error);
      return [];
    }
  },

  /**
   * Get system health status
   */
  getSystemHealth: async (): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    issues: string[];
    uptime: string;
  }> => {
    try {
      console.log('📊 Admin Dashboard: Đang kiểm tra tình trạng hệ thống...');
      
      const issues: string[] = [];
      
      // Check low stock products
      try {
        const lowStockData = await inventoryService.getLowStock(5);
        const lowStockCount = Array.isArray(lowStockData) ? lowStockData.length : 0;
        if (lowStockCount > 10) {
          issues.push(`${lowStockCount} sản phẩm sắp hết hàng`);
        }
      } catch (e) {
        issues.push('Không thể kiểm tra tồn kho');
      }

      // Check pending orders
      try {
        const pendingOrders = await orderService.getOrdersByStatus('PENDING', { page: 0, size: 1 });
        if (pendingOrders.totalElements > 20) {
          issues.push(`${pendingOrders.totalElements} đơn hàng chờ xử lý`);
        }
      } catch (e) {
        issues.push('Không thể kiểm tra đơn hàng');
      }

      let status: 'healthy' | 'warning' | 'critical' = 'healthy';
      if (issues.length > 2) {
        status = 'critical';
      } else if (issues.length > 0) {
        status = 'warning';
      }

      return {
        status,
        issues,
        uptime: '99.9%' // TODO: Get real uptime from backend
      };
    } catch (error: any) {
      console.error('❌ Admin Dashboard: Lỗi kiểm tra tình trạng hệ thống:', error);
      return {
        status: 'critical',
        issues: ['Không thể kiểm tra tình trạng hệ thống'],
        uptime: 'Unknown'
      };
    }
  }
,

  /**
   * Get monthly trends for revenue and order counts for the past N months.
   * This is a client-side aggregation fallback that groups orders by year-month.
   */
  getMonthlyTrends: async (months: number = 6): Promise<{ months: string[]; orders: number[]; revenue: number[] }> => {
    try {
      const now = new Date();
      const monthBuckets: { key: string; start: Date; end: Date }[] = [];
      for (let i = months - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const start = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0);
        const end = new Date(d.getFullYear(), d.getMonth() + 1, 1, 0, 0, 0);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthBuckets.push({ key, start, end });
      }

      // Fetch a large page of recent orders as fallback (server-side aggregation preferred)
      const pageSize = 1000;
      const ordersPage = await orderService.getOrders({ page: 0, size: pageSize, sort: 'createdAt,desc' });
      const all = ordersPage.content || [];

      const monthsArr: string[] = monthBuckets.map(m => m.key);
      const ordersCounts = new Array(months).fill(0);
      const revenueSums = new Array(months).fill(0);

      const isCancelled = (o: any) => {
        const s = String(o.status ?? o.order_status ?? '').toUpperCase();
        return s === 'CANCELLED' || s === 'CANCELED' || s === 'CANCEL';
      };

      for (const o of all) {
        const obj: any = o;
        const created = new Date(obj.created_at ?? obj.createdAt ?? 0);
        for (let i = 0; i < monthBuckets.length; i++) {
          const b = monthBuckets[i];
          if (created >= b.start && created < b.end) {
            ordersCounts[i] += 1;
            if (!isCancelled(o)) {
              revenueSums[i] += Number(obj.total_amount ?? obj.totalPrice ?? obj.total ?? 0);
            }
            break;
          }
        }
      }

      return { months: monthsArr, orders: ordersCounts, revenue: revenueSums };
    } catch (error) {
      console.warn('adminDashboardService.getMonthlyTrends failed:', error);
      return { months: [], orders: [], revenue: [] };
    }
  }
};
