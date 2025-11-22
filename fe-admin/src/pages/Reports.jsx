import { useState, useEffect } from 'react';
import { 
  ChartBarIcon, 
  CurrencyDollarIcon,
  ShoppingBagIcon,
  ClockIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';
import { reportsAPI } from '../api/reports';
import { formatCurrency } from '../utils/format';
import Button from '../components/common/Button';

const Reports = () => {
  const [activeTab, setActiveTab] = useState('revenue');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [revenueData, setRevenueData] = useState(null);
  const [menuItemsData, setMenuItemsData] = useState(null);
  const [supervisorsData, setSupervisorsData] = useState(null);
  const [operationalData, setOperationalData] = useState(null);
  const [financialData, setFinancialData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab, dateRange]);

  const fetchData = async () => {
    if (activeTab === 'revenue') {
      await fetchRevenueReport();
    } else if (activeTab === 'menu') {
      await fetchMenuItemsReport();
    } else if (activeTab === 'supervisors') {
      await fetchSupervisorsReport();
    } else if (activeTab === 'operational') {
      await fetchOperationalMetrics();
    } else if (activeTab === 'financial') {
      await fetchFinancialHealth();
    }
  };

  const fetchRevenueReport = async () => {
    try {
      setLoading(true);
      const response = await reportsAPI.getRevenue(dateRange.startDate, dateRange.endDate, 'day');
      if (response.success) {
        setRevenueData(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch revenue report:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMenuItemsReport = async () => {
    try {
      setLoading(true);
      const response = await reportsAPI.getMenuItems(dateRange.startDate, dateRange.endDate);
      if (response.success && response.data) {
        setMenuItemsData(response.data);
      } else {
        setMenuItemsData(null);
      }
    } catch (error) {
      console.error('Failed to fetch menu items report:', error);
      setMenuItemsData(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchSupervisorsReport = async () => {
    try {
      setLoading(true);
      const response = await reportsAPI.getSupervisors(dateRange.startDate, dateRange.endDate);
      if (response.success) {
        setSupervisorsData(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch supervisors report:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOperationalMetrics = async () => {
    try {
      setLoading(true);
      const response = await reportsAPI.getOperationalMetrics(dateRange.startDate, dateRange.endDate);
      if (response.success) {
        setOperationalData(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch operational metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFinancialHealth = async () => {
    try {
      setLoading(true);
      const response = await reportsAPI.getFinancialHealth(dateRange.startDate, dateRange.endDate);
      if (response.success) {
        setFinancialData(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch financial health:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'revenue', name: 'Revenue Analysis', icon: CurrencyDollarIcon },
    { id: 'menu', name: 'Product Performance', icon: ShoppingBagIcon },
    { id: 'operational', name: 'Operational Metrics', icon: ClockIcon },
    { id: 'financial', name: 'Financial Health', icon: ChartBarIcon },
    { id: 'supervisors', name: 'Team Performance', icon: ChartBarIcon },
  ];

  const calculatePercentage = (value, total) => {
    return total > 0 ? parseFloat(((value / total) * 100).toFixed(1)) : 0;
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Business Analytics</h1>
          <p className="text-gray-600 mt-1">Deep insights and performance analysis</p>
        </div>
        <div className="flex gap-2">
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-5 w-5" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Revenue Analysis */}
      {activeTab === 'revenue' && (
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : revenueData ? (
            <>
              {/* Key Metrics with Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Total Revenue</h3>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(revenueData.total.totalRevenue)}</p>
                  {revenueData.comparison && (
                    <div className={`flex items-center mt-2 text-sm ${
                      revenueData.comparison.revenueChange >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {revenueData.comparison.revenueChange >= 0 ? (
                        <ArrowUpIcon className="h-4 w-4 mr-1" />
                      ) : (
                        <ArrowDownIcon className="h-4 w-4 mr-1" />
                      )}
                      {Math.abs(revenueData.comparison.revenueChange)}% vs previous period
                    </div>
                  )}
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Cash</h3>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(revenueData.total.cashRevenue)}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {calculatePercentage(revenueData.total.cashRevenue, revenueData.total.totalRevenue)}% of total
                  </p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Card</h3>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(revenueData.total.cardRevenue)}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {calculatePercentage(revenueData.total.cardRevenue, revenueData.total.totalRevenue)}% of total
                  </p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Bank Transfer</h3>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(revenueData.total.bankRevenue)}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {calculatePercentage(revenueData.total.bankRevenue, revenueData.total.totalRevenue)}% of total
                  </p>
                </div>
              </div>

              {/* Revenue Trends Table */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Revenue Trends</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cash</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Card</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Bank</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Orders</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {revenueData.byDate.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item._id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">{formatCurrency(item.totalRevenue)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right">{formatCurrency(item.cashRevenue)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right">{formatCurrency(item.cardRevenue)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right">{formatCurrency(item.bankRevenue)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right">{item.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">No data available</div>
          )}
        </div>
      )}

      {/* Product Performance */}
      {activeTab === 'menu' && (
        <div>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : menuItemsData && menuItemsData.summary && menuItemsData.items ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Total Items Sold</h3>
                  <p className="text-2xl font-bold text-gray-900">{menuItemsData.summary.totalItems || 0}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Total Revenue</h3>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(menuItemsData.summary.totalRevenue || 0)}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Avg Revenue/Item</h3>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(menuItemsData.summary.avgRevenuePerItem || 0)}</p>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b">
                  <h3 className="text-lg font-semibold">Product Performance Analysis</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Quantity</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Revenue Share</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Avg Price</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Orders</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {menuItemsData.items.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="px-6 py-4 text-center text-gray-500">No data available</td>
                        </tr>
                      ) : (
                        menuItemsData.items.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name || 'N/A'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{item.category || 'N/A'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right">{item.totalQuantity || 0}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">{formatCurrency(item.totalRevenue || 0)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                              <div className="flex items-center justify-end gap-2">
                                <div className="w-16 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-blue-600 h-2 rounded-full" 
                                    style={{ width: `${item.revenueShare || 0}%` }}
                                  ></div>
                                </div>
                                <span>{item.revenueShare || 0}%</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right">{formatCurrency(item.avgPrice || 0)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right">{item.orderCount || 0}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">No data available</div>
          )}
        </div>
      )}

      {/* Operational Metrics */}
      {activeTab === 'operational' && (
        <div>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : operationalData ? (
            <div className="space-y-6">
              {/* AOV Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Average Order Value</h3>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(operationalData.averageOrderValue.avg)}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Min Order Value</h3>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(operationalData.averageOrderValue.min)}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Max Order Value</h3>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(operationalData.averageOrderValue.max)}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Total Orders</h3>
                  <p className="text-2xl font-bold text-gray-900">{operationalData.averageOrderValue.totalOrders}</p>
                </div>
              </div>

              {/* Day of Week Distribution */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Day of Week Distribution</h3>
                <div className="space-y-3">
                  {operationalData.dayOfWeekDistribution.map((day, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{day.dayName}</span>
                          <span className="text-sm text-gray-600">{day.orderCount} orders</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ 
                              width: `${calculatePercentage(day.orderCount, operationalData.averageOrderValue.totalOrders)}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                      <div className="ml-4 text-right">
                        <p className="font-medium">{formatCurrency(day.revenue)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hourly Distribution */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Peak Hours Analysis</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {operationalData.hourlyDistribution.map((hour, index) => (
                    <div key={index} className="text-center p-4 border rounded-lg">
                      <p className="text-sm font-medium text-gray-900">{hour.hour}:00</p>
                      <p className="text-lg font-bold text-blue-600 mt-1">{hour.orderCount}</p>
                      <p className="text-xs text-gray-500">{formatCurrency(hour.revenue)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">No data available</div>
          )}
        </div>
      )}

      {/* Financial Health */}
      {activeTab === 'financial' && (
        <div>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : financialData ? (
            <div className="space-y-6">
              {/* KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Conversion Rate</h3>
                  <p className="text-2xl font-bold text-gray-900">{financialData.kpis.conversionRate}%</p>
                  <p className="text-xs text-gray-500 mt-1">{financialData.kpis.paidOrders} / {financialData.kpis.totalOrders} orders</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Cancellation Rate</h3>
                  <p className="text-2xl font-bold text-gray-900">{financialData.kpis.cancellationRate}%</p>
                  <p className="text-xs text-gray-500 mt-1">{financialData.kpis.cancelledOrders} cancelled</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Total Orders</h3>
                  <p className="text-2xl font-bold text-gray-900">{financialData.kpis.totalOrders}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Paid Orders</h3>
                  <p className="text-2xl font-bold text-gray-900">{financialData.kpis.paidOrders}</p>
                </div>
              </div>

              {/* Payment Method Analysis */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Payment Method Distribution</h3>
                <div className="space-y-4">
                  {financialData.paymentMethods.map((method, index) => {
                    const totalRevenue = financialData.paymentMethods.reduce((sum, m) => sum + m.totalRevenue, 0);
                    const percentage = calculatePercentage(method.totalRevenue, totalRevenue);
                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="font-medium capitalize">{method.method}</span>
                            <span className="text-sm text-gray-500">{method.count} transactions</span>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{formatCurrency(method.totalRevenue)}</p>
                            <p className="text-sm text-gray-500">{percentage}%</p>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className="bg-blue-600 h-3 rounded-full" 
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Order Status Breakdown */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Order Status Breakdown</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Count</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {financialData.orderStatus.map((status, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">
                            {status._id.replace('_', ' ')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right">{status.count}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                            {formatCurrency(status.totalRevenue)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">No data available</div>
          )}
        </div>
      )}

      {/* Team Performance */}
      {activeTab === 'supervisors' && (
        <div>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : supervisorsData ? (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b">
                <h3 className="text-lg font-semibold">Supervisor Performance Metrics</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supervisor</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Orders</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Avg Order Value</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Conversion Rate</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cancellation Rate</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {supervisorsData.supervisors.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-4 text-center text-gray-500">No data available</td>
                      </tr>
                    ) : (
                      supervisorsData.supervisors.map((stat, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{stat.supervisor.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right">{stat.orderCount}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">{formatCurrency(stat.totalRevenue)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right">{formatCurrency(stat.avgOrderValue)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              stat.conversionRate >= 80 ? 'bg-green-100 text-green-800' :
                              stat.conversionRate >= 60 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {stat.conversionRate}%
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              stat.cancellationRate <= 5 ? 'bg-green-100 text-green-800' :
                              stat.cancellationRate <= 10 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {stat.cancellationRate}%
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">No data available</div>
          )}
        </div>
      )}
    </div>
  );
};

export default Reports;
