import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeftIcon, 
  PlusIcon, 
  XMarkIcon, 
  PaperAirplaneIcon, 
  CreditCardIcon,
  BanknotesIcon,
  BuildingLibraryIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { menuAPI, ordersAPI, kitchenAPI, paymentAPI, tablesAPI } from '../api';
import { formatCurrency } from '../utils/format';
import { PAYMENT_METHODS } from '../utils/constants';
import { useToast } from '../context/ToastContext';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import ConfirmModal from '../components/common/ConfirmModal';
import Header from '../components/layout/Header';

const Order = () => {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  
  const [table, setTable] = useState(null);
  const [order, setOrder] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [addingItems, setAddingItems] = useState(new Set());

  useEffect(() => {
    fetchData(true);
  }, [tableId]);

  const fetchOrder = async () => {
    try {
      const ordersRes = await ordersAPI.getByTable(tableId);
      if (ordersRes.success && ordersRes.data.length > 0) {
        const latestOrder = ordersRes.data[0];
        const orderRes = await ordersAPI.getById(latestOrder._id);
        if (orderRes.success) {
          setOrder(orderRes.data);
          return orderRes.data;
        }
      }
      return null;
    } catch (error) {
      return null;
    }
  };

  const fetchData = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const [tableRes, menuRes] = await Promise.all([
        tablesAPI.getById(tableId),
        menuAPI.getAll(),
      ]);

      if (tableRes.success) {
        setTable(tableRes.data);
        if (tableRes.data.type === 'takeaway') {
          localStorage.setItem('lastViewType', 'takeaway');
        } else if (tableRes.data.floor) {
          localStorage.setItem('lastViewType', 'floor');
          localStorage.setItem('lastFloor', tableRes.data.floor.toString());
        }
      }
      if (menuRes.success) setMenuItems(menuRes.data);
      
      await fetchOrder();
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const createOrder = async () => {
    try {
      const response = await ordersAPI.create(tableId);
      if (response.success) {
        setOrder(response.data);
        return response.data;
      }
      return null;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create order';
      
      if (errorMessage.includes('unpaid order') || errorMessage.includes('active order')) {
        const existingOrder = await fetchOrder();
        if (existingOrder) {
          toast.warning('Table has an unpaid order. Loading existing order...');
          return existingOrder;
        }
      }
      
      if (error.response?.data?.data) {
        setOrder(error.response.data.data);
        toast.warning(errorMessage);
        return error.response.data.data;
      }
      
      toast.error(errorMessage);
      return null;
    }
  };

  const addItemToOrder = async (menuItemId, quantity = 1, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const loadingKey = quantity === 0.5 ? `${menuItemId}_half` : menuItemId;
    
    if (addingItems.has(loadingKey)) {
      return;
    }

    setAddingItems(prev => new Set(prev).add(loadingKey));
    
    try {
      let currentOrder = order;
      
      if (!currentOrder) {
        currentOrder = await createOrder();
        if (!currentOrder) {
          setAddingItems(prev => {
            const newSet = new Set(prev);
            newSet.delete(loadingKey);
            return newSet;
          });
          return;
        }
      }

      const response = await ordersAPI.addItem(currentOrder._id, menuItemId, quantity);
      if (response.success) {
        setOrder(response.data);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to add item');
    } finally {
      setAddingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(loadingKey);
        return newSet;
      });
    }
  };

  const removeItem = async (itemId, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!order) return;
    
    try {
      const response = await ordersAPI.deleteItem(order._id, itemId);
      if (response.success) {
        if (response.data === null) {
          setOrder(null);
          await fetchData(false);
        } else {
          setOrder(response.data);
        }
      }
    } catch (error) {
      toast.error(error.message || 'Failed to remove item');
    }
  };

  const sendToKitchen = async () => {
    if (!order) return;
    setShowConfirmModal(true);
  };

  const getNavigateParams = () => {
    const savedState = location.state || {};
    let viewType = savedState.viewType;
    let floor = savedState.floor;
    
    if (!viewType && table) {
      if (table.type === 'takeaway') {
        viewType = 'takeaway';
      } else if (table.floor) {
        viewType = 'floor';
        floor = table.floor;
      }
    }
    
    if (!viewType) {
      viewType = localStorage.getItem('lastViewType') || 'floor';
      floor = parseInt(localStorage.getItem('lastFloor') || '1');
    }
    
    const params = new URLSearchParams();
    if (viewType === 'floor') {
      params.set('floor', (floor || 1).toString());
      params.set('view', 'floor');
    } else if (viewType === 'takeaway') {
      params.set('view', 'takeaway');
    }
    return params.toString();
  };

  const confirmSendToKitchen = async () => {
    setShowConfirmModal(false);
    setProcessing(true);
    try {
      const response = await kitchenAPI.sendToKitchen(order._id);
      if (response.success) {
        setOrder(response.data);
        toast.success('Order sent to kitchen');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to send to kitchen');
    } finally {
      setProcessing(false);
    }
  };

  const handlePayment = async () => {
    if (!selectedPaymentMethod || !order) {
      if (!selectedPaymentMethod) toast.warning('Please select payment method');
      return;
    }
    setProcessing(true);
    try {
      const response = await paymentAPI.processPayment(order._id, selectedPaymentMethod);
      if (response.success) {
        toast.success('Payment processed successfully');
        setShowPaymentModal(false);
        setOrder(null);
        navigate(`/tables?${getNavigateParams()}`);
      }
    } catch (error) {
      toast.error(error.message || 'Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  const filteredMenu = selectedCategory === 'all' 
    ? menuItems 
    : menuItems.filter(item => item.category === selectedCategory);

  const categories = ['all', 'drink', 'pizza', 'pasta'];
  const categoryLabels = {
    all: 'All',
    drink: 'Drinks',
    pizza: 'Pizza',
    pasta: 'Pasta',
  };

  const paymentIcons = {
    cash: BanknotesIcon,
    card: CreditCardIcon,
    bank: BuildingLibraryIcon,
  };

  const getItemStatus = (item) => {
    return item.kitchenStatus || 'pending';
  };

  const isItemSentToKitchen = (item) => {
    const status = getItemStatus(item);
    return status !== 'pending';
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: 'Pending', color: 'bg-gray-100 text-gray-800 border-gray-300' },
      sent: { label: 'Sent', color: 'bg-blue-100 text-blue-800 border-blue-300' },
      cooking: { label: 'Cooking', color: 'bg-orange-100 text-orange-800 border-orange-300' },
      ready: { label: 'Ready', color: 'bg-green-100 text-green-800 border-green-300' },
      declined: { label: 'Declined', color: 'bg-red-100 text-red-800 border-red-300' },
    };
    return statusConfig[status] || statusConfig.pending;
  };

  const groupItemsByStatus = (items) => {
    const pending = items.filter(item => getItemStatus(item) === 'pending');
    const sent = items.filter(item => isItemSentToKitchen(item));
    return { pending, sent };
  };

  const hasPendingItems = order && order.items && order.items.some(item => getItemStatus(item) === 'pending');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="text-xl">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              {table?.type === 'takeaway' 
                ? table?.tableNumber || 'Take Away'
                : table?.type === 'pizza_bar'
                ? 'Pizza Bar'
                : `Table ${table?.tableNumber || ''}`}
            </h1>
            {order && (
              <p className="text-gray-600">Order: {order.orderNumber}</p>
            )}
          </div>
          <Button variant="secondary" onClick={() => navigate(`/tables?${getNavigateParams()}`)}>
            <ArrowLeftIcon className="h-4 w-4 mr-1 inline" />
            Back
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold mb-4">Menu</h2>
              
              <div className="flex gap-2 mb-4 flex-wrap">
                {categories.map((cat) => (
                  <Button
                    key={cat}
                    variant={selectedCategory === cat ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {categoryLabels[cat]}
                  </Button>
                ))}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {filteredMenu.map((item) => {
                  const isPizza = item.category === 'pizza';
                  const isAddingFull = addingItems.has(item._id);
                  const isAddingHalf = addingItems.has(`${item._id}_half`);
                  
                  return (
                    <div
                      key={item._id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <h3 className="font-semibold mb-2">{item.name}</h3>
                      <p className="text-blue-600 font-bold mb-3">
                        {formatCurrency(item.price)}
                      </p>
                      {isPizza ? (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="primary"
                            type="button"
                            disabled={isAddingFull || isAddingHalf}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              addItemToOrder(item._id, 1, e);
                            }}
                            className="flex-1"
                          >
                            <PlusIcon className="h-4 w-4 mr-1 inline" />
                            {isAddingFull ? 'Adding...' : 'Add'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            type="button"
                            disabled={isAddingFull || isAddingHalf}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              addItemToOrder(item._id, 0.5, e);
                            }}
                            className="flex-1"
                          >
                            <PlusIcon className="h-4 w-4 mr-1 inline" />
                            {isAddingHalf ? 'Adding...' : 'Add 1/2'}
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="primary"
                          type="button"
                          disabled={isAddingFull}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            addItemToOrder(item._id, 1, e);
                          }}
                          className="w-full"
                        >
                          <PlusIcon className="h-4 w-4 mr-1 inline" />
                          {isAddingFull ? 'Adding...' : 'Add'}
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <h2 className="text-2xl font-bold mb-4">Order</h2>
              
              {!order || !order.items || order.items.length === 0 ? (
                <div className="text-gray-500 text-center py-8">
                  No items
                </div>
              ) : (
                <>
                  <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
                    {(() => {
                      const { pending, sent } = groupItemsByStatus(order.items);
                      
                      return (
                        <>
                          {/* Pending Items Section */}
                          {pending.length > 0 && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                <ClockIcon className="h-4 w-4" />
                                <span>Pending ({pending.length})</span>
                              </div>
                              {pending.map((item) => {
                                const menuItem = item.menuItemId || {};
                                const itemName = menuItem.name || item.name || 'Unknown';
                                const itemPrice = menuItem.price || item.unitPrice || 0;
                                const itemTotal = item.totalPrice || (itemPrice * item.quantity);
                                
                                return (
                                  <div
                                    key={item._id}
                                    className="flex items-center justify-between border-l-4 border-blue-500 bg-blue-50 rounded-r-lg p-3"
                                  >
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <div className="font-semibold">
                                          {itemName}
                                          {item.quantity === 0.5 && (
                                            <span className="text-xs text-gray-500 ml-2">(Half)</span>
                                          )}
                                        </div>
                                        <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatusBadge(getItemStatus(item)).color}`}>
                                          {getStatusBadge(getItemStatus(item)).label}
                                        </span>
                                      </div>
                                      <div className="text-sm text-gray-600">
                                        {item.quantity === 0.5 ? '0.5' : item.quantity} x {formatCurrency(itemPrice)} = {formatCurrency(itemTotal)}
                                      </div>
                                      {item.note && (
                                        <div className="text-xs text-gray-500">Note: {item.note}</div>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold">
                                        {formatCurrency(itemTotal)}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={(e) => removeItem(item._id, e)}
                                        className="text-red-500 hover:text-red-700 p-1 transition-colors"
                                        title="Remove item"
                                      >
                                        <XMarkIcon className="h-5 w-5" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Sent to Kitchen Items Section */}
                          {sent.length > 0 && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                <CheckCircleIcon className="h-4 w-4 text-green-600" />
                                <span>Sent to Kitchen ({sent.length})</span>
                              </div>
                              {sent.map((item) => {
                                const menuItem = item.menuItemId || {};
                                const itemName = menuItem.name || item.name || 'Unknown';
                                const itemPrice = menuItem.price || item.unitPrice || 0;
                                const itemTotal = item.totalPrice || (itemPrice * item.quantity);
                                const status = getItemStatus(item);
                                const statusBadge = getStatusBadge(status);
                                const isLocked = isItemSentToKitchen(item);
                                
                                return (
                                  <div
                                    key={item._id}
                                    className={`flex items-center justify-between border-l-4 rounded-r-lg p-3 ${
                                      status === 'ready' 
                                        ? 'border-green-500 bg-green-50' 
                                        : status === 'declined'
                                        ? 'border-red-500 bg-red-50'
                                        : 'border-gray-400 bg-gray-50'
                                    } ${isLocked ? 'opacity-90' : ''}`}
                                  >
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <div className={`font-semibold ${isLocked ? 'text-gray-600' : ''}`}>
                                          {itemName}
                                          {item.quantity === 0.5 && (
                                            <span className="text-xs text-gray-500 ml-2">(Half)</span>
                                          )}
                                        </div>
                                        <span className={`text-xs px-2 py-0.5 rounded-full border ${statusBadge.color}`}>
                                          {statusBadge.label}
                                        </span>
                                      </div>
                                      <div className="text-sm text-gray-600">
                                        {item.quantity === 0.5 ? '0.5' : item.quantity} x {formatCurrency(itemPrice)} = {formatCurrency(itemTotal)}
                                      </div>
                                      {item.note && (
                                        <div className="text-xs text-gray-500">Note: {item.note}</div>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold">
                                        {formatCurrency(itemTotal)}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          if (isLocked) {
                                            toast.warning('Cannot remove items that have been sent to kitchen');
                                            return;
                                          }
                                          removeItem(item._id, e);
                                        }}
                                        disabled={isLocked}
                                        className={`p-1 transition-colors ${
                                          isLocked 
                                            ? 'text-gray-400 cursor-not-allowed' 
                                            : 'text-red-500 hover:text-red-700'
                                        }`}
                                        title={isLocked ? 'Item sent to kitchen - cannot remove' : 'Remove item'}
                                      >
                                        <XMarkIcon className="h-5 w-5" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>

                  <div className="border-t pt-4 mb-4">
                    <div className="flex justify-between text-xl font-bold">
                      <span>Total:</span>
                      <span className="text-blue-600">
                        {formatCurrency(order.total || order.subtotal || 0)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Button
                      variant="success"
                      className="w-full"
                      onClick={sendToKitchen}
                      disabled={processing || !hasPendingItems}
                    >
                      <PaperAirplaneIcon className="h-4 w-4 mr-1 inline" />
                      {hasPendingItems ? `Send ${order.items.filter(item => getItemStatus(item) === 'pending').length} Item(s) to Kitchen` : 'No Pending Items'}
                    </Button>
                    <Button
                      variant="primary"
                      className="w-full"
                      onClick={() => setShowPaymentModal(true)}
                      disabled={processing}
                    >
                      <CreditCardIcon className="h-4 w-4 mr-1 inline" />
                      Pay
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmSendToKitchen}
        title="Confirm"
        message={order ? `Send ${order.items.filter(item => getItemStatus(item) === 'pending').length} pending item(s) to kitchen?` : 'Send this order to kitchen?'}
        confirmText="Send"
        cancelText="Cancel"
      />

      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Select Payment Method"
      >
        <div className="space-y-4">
          {PAYMENT_METHODS.map((method) => {
            const IconComponent = paymentIcons[method.value];
            return (
              <button
                key={method.value}
                onClick={() => setSelectedPaymentMethod(method.value)}
                className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                  selectedPaymentMethod === method.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  {IconComponent && <IconComponent className="h-6 w-6 text-gray-700" />}
                  <span className="font-semibold">{method.label}</span>
                </div>
              </button>
            );
          })}
          
          {order && (
            <div className="mt-4 p-4 bg-gray-100 rounded-lg">
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span>{formatCurrency(order.total || order.subtotal || 0)}</span>
              </div>
            </div>
          )}

          <div className="flex gap-2 mt-4">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setShowPaymentModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={handlePayment}
              disabled={!selectedPaymentMethod || processing}
            >
              {processing ? 'Processing...' : 'Confirm'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Order;
