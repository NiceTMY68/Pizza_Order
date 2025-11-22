import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowUpIcon, 
  ArrowDownIcon, 
  ShoppingBagIcon, 
  TableCellsIcon,
  CurrencyDollarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { adminAPI } from '../api/admin';
import { formatCurrency } from '../utils/format';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Set default date range to today
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const [dateRange, setDateRange] = useState({
    startDate: getTodayDate(),
    endDate: getTodayDate()
  });

  useEffect(() => {
    // Fetch on mount and when date range changes
    if (dateRange.startDate && dateRange.endDate) {
      fetchDashboard();
    }
  }, [dateRange.startDate, dateRange.endDate]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getDashboard(dateRange.startDate, dateRange.endDate);
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeApply = () => {
    if (dateRange.startDate && dateRange.endDate) {
      fetchDashboard();
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cooking':
        return 'bg-yellow-100 text-yellow-800';
      case 'sent_to_kitchen':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatStatus = (status) => {
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            placeholder="Start Date"
          />
          <span className="text-gray-500">to</span>
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            placeholder="End Date"
          />
          <button
            onClick={handleDateRangeApply}
            disabled={!dateRange.startDate || !dateRange.endDate}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Apply
          </button>
          {(dateRange.startDate || dateRange.endDate) && (
            <button
              onClick={() => {
                setDateRange({ startDate: '', endDate: '' });
                setStats(null);
              }}
              className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors text-sm"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {stats && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-gray-500 text-sm font-medium">Total Revenue</h3>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {formatCurrency(stats.revenue?.totalRevenue || 0)}
                  </p>
                  {stats.revenueChange !== undefined && !isNaN(stats.revenueChange) && stats.revenueChange !== 0 && (
                    <div className={`flex items-center mt-2 text-sm ${
                      stats.revenueChange > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stats.revenueChange > 0 ? (
                        <ArrowUpIcon className="h-4 w-4 mr-1" />
                      ) : (
                        <ArrowDownIcon className="h-4 w-4 mr-1" />
                      )}
                      {Math.abs(stats.revenueChange).toFixed(1)}% vs previous period
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    From {stats.revenue?.count || 0} payment{stats.revenue?.count !== 1 ? 's' : ''}
                  </p>
                </div>
                <CurrencyDollarIcon className="h-12 w-12 text-blue-500 opacity-20" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-gray-500 text-sm font-medium">Total Orders</h3>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {stats.orders.total}
                  </p>
                  {stats.ordersChange !== undefined && !isNaN(stats.ordersChange) && stats.ordersChange !== 0 && (
                    <div className={`flex items-center mt-2 text-sm ${
                      stats.ordersChange > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stats.ordersChange > 0 ? (
                        <ArrowUpIcon className="h-4 w-4 mr-1" />
                      ) : (
                        <ArrowDownIcon className="h-4 w-4 mr-1" />
                      )}
                      {Math.abs(stats.ordersChange).toFixed(1)}% vs previous period
                    </div>
                  )}
                </div>
                <ShoppingBagIcon className="h-12 w-12 text-green-500 opacity-20" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-gray-500 text-sm font-medium">Active Tables</h3>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {stats.tables.active || 0} / {stats.tables.total || 0}
                  </p>
                  {stats.tables.total > 0 && (
                    <p className="text-sm text-gray-500 mt-1">
                      {((stats.tables.active / stats.tables.total) * 100).toFixed(0)}% occupied
                    </p>
                  )}
                </div>
                <TableCellsIcon className="h-12 w-12 text-yellow-500 opacity-20" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-gray-500 text-sm font-medium">Payments</h3>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {stats.revenue?.count || 0}
                  </p>
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-gray-500">Cash: {formatCurrency(stats.revenue?.cashRevenue || 0)}</p>
                    <p className="text-xs text-gray-500">Card: {formatCurrency(stats.revenue?.cardRevenue || 0)}</p>
                    <p className="text-xs text-gray-500">Bank: {formatCurrency(stats.revenue?.bankRevenue || 0)}</p>
                  </div>
                </div>
                <ClockIcon className="h-12 w-12 text-purple-500 opacity-20" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Top Selling Items */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-semibold">Top Selling Items</h2>
                <Link to="/reports" className="text-sm text-blue-600 hover:text-blue-800">
                  View All →
                </Link>
              </div>
              <div className="p-6">
                {stats.topItems && stats.topItems.length > 0 ? (
                  <div className="space-y-4">
                    {stats.topItems.slice(0, 5).map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold text-sm">
                            {index + 1}
                          </span>
                          <div>
                            <p className="font-medium text-gray-900">{item.name}</p>
                            <p className="text-sm text-gray-500">Qty: {item.totalQuantity}</p>
                          </div>
                        </div>
                        <p className="font-medium text-gray-900">{formatCurrency(item.totalRevenue)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No items sold in this period</p>
                )}
              </div>
            </div>

            {/* Order Status Breakdown */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold">Order Status</h2>
              </div>
              <div className="p-6">
                {stats.orders.byStatus && stats.orders.byStatus.length > 0 ? (
                  <div className="space-y-3">
                    {stats.orders.byStatus.map((status, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(status._id)}`}>
                            {formatStatus(status._id)}
                          </span>
                        </div>
                        <p className="font-medium text-gray-900">{status.count}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No orders in this period</p>
                )}
              </div>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold">Recent Orders</h2>
              <Link to="/orders" className="text-sm text-blue-600 hover:text-blue-800">
                View All →
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order #</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Table</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supervisor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stats.recentOrders && stats.recentOrders.length > 0 ? (
                    stats.recentOrders.map((order) => (
                      <tr key={order._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {order.orderNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {order.tableId?.tableNumber || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {order.supervisorId?.name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(order.status)}`}>
                            {formatStatus(order.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(order.total || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-4 text-center text-gray-500">No recent orders</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
