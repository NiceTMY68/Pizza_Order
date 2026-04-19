import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeftIcon, 
  PlusIcon, 
  XMarkIcon, 
  PaperAirplaneIcon, 
  BanknotesIcon,
  QrCodeIcon,
  CheckCircleIcon,
  ClockIcon,
  ShoppingCartIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';
import { menuAPI, ordersAPI, kitchenAPI, paymentAPI, tablesAPI } from '../api';
import { formatCurrency } from '../utils/format';
import { PAYMENT_METHODS } from '../utils/constants';
import { useToast } from '../context/ToastContext';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import ConfirmModal from '../components/common/ConfirmModal';
import Header from '../components/layout/Header';
import halfHalfPizzaImg from '../assets/half-half-pizza.png';

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
  const [showHalfModal, setShowHalfModal] = useState(false);
  const [halfLeft, setHalfLeft] = useState(null);
  const [halfRight, setHalfRight] = useState(null);
  const [discountType, setDiscountType] = useState(null);
  const [discountValue, setDiscountValue] = useState('');
  const [discountReason, setDiscountReason] = useState('');
  const [momoQrUrl, setMomoQrUrl] = useState('');
  const [momoPayUrl, setMomoPayUrl] = useState('');
  const [momoPaymentStatus, setMomoPaymentStatus] = useState('idle');
  const [momoLoading, setMomoLoading] = useState(false);
  const momoPollingRef = useRef(null);
  const [showCartModal, setShowCartModal] = useState(false);
  const categoryRefs = useRef({});
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [pendingAddItem, setPendingAddItem] = useState(null);
  const [itemNoteDraft, setItemNoteDraft] = useState('');
  const [halfHalfNote, setHalfHalfNote] = useState('');

  const scrollToCategory = (cat) => {
    setSelectedCategory(cat);
    if (cat === 'all') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (categoryRefs.current[cat]) {
      const yOffset = -100; 
      const element = categoryRefs.current[cat];
      const y = element.getBoundingClientRect().top + window.scrollY + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 150;
      let activeCat = 'all';

      for (const cat of ['drink', 'pizza', 'pasta']) {
        const el = categoryRefs.current[cat];
        if (el && el.offsetTop <= scrollPosition) {
          activeCat = cat;
        }
      }
      setSelectedCategory(activeCat);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  const addItemToOrder = async (menuItemId, quantity = 1, e, note = '') => {
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

      const response = await ordersAPI.addItem(currentOrder._id, menuItemId, quantity, note);
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

  const openAddItemNoteModal = (item, quantity = 1, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setPendingAddItem({
      menuItemId: item._id,
      name: item.name,
      quantity
    });
    setItemNoteDraft('');
    setShowAddItemModal(true);
  };

  const closeAddItemNoteModal = () => {
    setShowAddItemModal(false);
    setPendingAddItem(null);
    setItemNoteDraft('');
  };

  const confirmAddItemWithNote = async () => {
    if (!pendingAddItem) return;
    await addItemToOrder(
      pendingAddItem.menuItemId,
      pendingAddItem.quantity,
      null,
      itemNoteDraft.trim()
    );
    closeAddItemNoteModal();
  };

  const increasePendingItemQty = () => {
    setPendingAddItem((prev) => {
      if (!prev) return prev;
      return { ...prev, quantity: Math.min(99, (Number(prev.quantity) || 1) + 1) };
    });
  };

  const decreasePendingItemQty = () => {
    setPendingAddItem((prev) => {
      if (!prev) return prev;
      return { ...prev, quantity: Math.max(1, (Number(prev.quantity) || 1) - 1) };
    });
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

  const filteredMenu = selectedCategory === 'all' 
    ? menuItems 
    : menuItems.filter(item => item.category === selectedCategory);
  const halfHalfOptions = menuItems.filter(item => item.category === 'pizza' && item.supportsHalfHalf);

  const categories = ['all', 'drink', 'pizza', 'pasta'];
  const categoryLabels = {
    all: 'All',
    drink: 'Drinks',
    pizza: 'Pizza',
    pasta: 'Pasta',
  };

  const paymentIcons = {
    cash: BanknotesIcon,
    momo: QrCodeIcon,
  };

  const stopMomoPolling = () => {
    if (momoPollingRef.current) {
      clearInterval(momoPollingRef.current);
      momoPollingRef.current = null;
    }
  };

  const resetMomoState = () => {
    stopMomoPolling();
    setMomoQrUrl('');
    setMomoPayUrl('');
    setMomoPaymentStatus('idle');
    setMomoLoading(false);
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedPaymentMethod('');
    resetMomoState();
  };

  const startMomoPolling = (orderId) => {
    stopMomoPolling();
    momoPollingRef.current = setInterval(async () => {
      try {
        const statusRes = await paymentAPI.getMomoStatus(orderId);
        const status = statusRes?.data?.payment?.status;
        if (status === 'paid') {
          setMomoPaymentStatus('paid');
          stopMomoPolling();
          toast.success('MoMo payment received');
        } else if (status === 'failed' || status === 'cancelled') {
          setMomoPaymentStatus('failed');
          stopMomoPolling();
        } else if (status === 'pending') {
          setMomoPaymentStatus('pending');
        }
      } catch (error) {
      }
    }, 3000);
  };

  const createMomoQr = async () => {
    if (!order?._id) return;
    setMomoLoading(true);
    try {
      const response = await paymentAPI.createMomoQr(order._id);
      if (response.success) {
        const data = response.data || {};
        setMomoQrUrl(data.qrCodeUrl || '');
        setMomoPayUrl(data.payUrl || '');
        setMomoPaymentStatus('pending');
        startMomoPolling(order._id);
      } else {
        toast.error(response.message || 'Failed to create MoMo QR');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to create MoMo QR');
      setMomoPaymentStatus('failed');
    } finally {
      setMomoLoading(false);
    }
  };

  const handleSelectPaymentMethod = async (method) => {
    setSelectedPaymentMethod(method);
    if (method === 'momo') {
      if (!momoQrUrl && !momoPayUrl) {
        await createMomoQr();
      }
      return;
    }
    resetMomoState();
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
  
  const getPayableSubtotalPreview = () => {
    if (!order?.items?.length) return 0;
    return order.items
      .filter(item => item.kitchenStatus === 'ready')
      .reduce((sum, item) => sum + (item.totalPrice || 0), 0);
  };

  const getDiscountPreview = () => {
    const subtotal = getPayableSubtotalPreview();
    if (!discountType || !discountValue) return 0;
    const val = Number(discountValue);
    if (isNaN(val) || val <= 0) return 0;
    if (discountType === 'percent') {
      const pct = Math.max(0, Math.min(100, val));
      const raw = (subtotal * pct) / 100;
      return Math.round(raw * 100) / 100;
    }
    return Math.max(0, Math.min(subtotal, val));
  };
  
  const getTotalPreview = () => {
    const subtotal = getPayableSubtotalPreview();
    const disc = getDiscountPreview();
    return Math.max(0, subtotal - disc);
  };

  const hasPendingItems = order && order.items && order.items.some(item => getItemStatus(item) === 'pending');

  useEffect(() => {
    if (!showPaymentModal && selectedPaymentMethod !== 'momo') {
      resetMomoState();
    }
  }, [showPaymentModal, selectedPaymentMethod]);

  useEffect(() => {
    return () => {
      stopMomoPolling();
    };
  }, []);

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
    <div className="min-h-screen bg-gray-100 pb-20">
      <Header />
      
      <div className="container mx-auto px-4 py-6 flex gap-6 relative items-start">
        {/* Sidebar Categories (Scrollspy) */}
        <div className="hidden lg:block w-48 sticky top-24 shrink-0">
          <div className="bg-white rounded-lg shadow-md p-4 space-y-2">
            <h3 className="font-bold text-gray-800 mb-3 uppercase tracking-wider text-sm">Categories</h3>
            <button
              onClick={() => scrollToCategory('all')}
              className={`w-full text-left px-4 py-2 rounded-md transition-colors ${
                selectedCategory === 'all' 
                  ? 'bg-blue-600 text-white font-medium shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              All Menu
            </button>
            {['pizza', 'pasta', 'drink'].map((cat) => (
              <button
                key={cat}
                onClick={() => scrollToCategory(cat)}
                className={`w-full text-left px-4 py-2 rounded-md transition-colors capitalize ${
                  selectedCategory === cat 
                    ? 'bg-blue-600 text-white font-medium shadow-sm' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                {categoryLabels[cat]}
              </button>
            ))}
          </div>
        </div>

        {/* Main Menu Area */}
        <div className="flex-1 w-full max-w-full min-w-0">
          <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-lg shadow-sm">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                {table?.type === 'takeaway' 
                  ? table?.tableNumber || 'Take Away'
                  : table?.type === 'pizza_bar'
                  ? 'Pizza Bar'
                  : `Table ${table?.tableNumber || ''}`}
              </h1>
              {order && (
                <p className="text-gray-500 text-sm mt-1">Order: {order.orderNumber}</p>
              )}
            </div>
            <Button variant="secondary" size="sm" onClick={() => navigate(`/tables?${getNavigateParams()}`)}>
              <ArrowLeftIcon className="h-4 w-4 mr-1 inline" />
              Back
            </Button>
          </div>

          <div className="space-y-8">
            {/* Mobile Categories (Horizontal Scroll) */}
            <div className="lg:hidden flex gap-2 overflow-x-auto pb-2 scrollbar-hide sticky top-0 z-10 bg-gray-100 py-2">
              <Button
                variant={selectedCategory === 'all' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => scrollToCategory('all')}
                className="whitespace-nowrap"
              >
                All Menu
              </Button>
              {['pizza', 'pasta', 'drink'].map((cat) => (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => scrollToCategory(cat)}
                  className="whitespace-nowrap"
                >
                  {categoryLabels[cat]}
                </Button>
              ))}
            </div>

            {/* Sections */}
            {['pizza', 'pasta', 'drink'].map(cat => {
              const catItems = menuItems.filter(item => item.category === cat);
              if (catItems.length === 0 && cat !== 'pizza') return null;

              return (
                <div 
                  key={cat} 
                  ref={el => categoryRefs.current[cat] = el}
                  className="bg-white rounded-lg shadow-md p-6 scroll-mt-24"
                >
                  <h2 className="text-2xl font-bold mb-6 capitalize text-gray-800 border-b pb-2">{categoryLabels[cat]}</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                    {cat === 'pizza' && (
                      <div
                        className="border rounded-lg p-4 hover:shadow-md transition-all cursor-pointer bg-blue-50 flex flex-col h-full hover:-translate-y-1"
                        onClick={() => {
                          setHalfLeft(null);
                          setHalfRight(null);
                          setHalfHalfNote('');
                          setShowHalfModal(true);
                        }}
                      >
                        <div className="w-full aspect-[16/9] rounded-md mb-3 overflow-hidden bg-gray-50 shrink-0 shadow-sm">
                          <img src={halfHalfPizzaImg} alt="Pizza Half-Half" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                        </div>
                        <h3 className="font-semibold mb-2 text-blue-900">Pizza Half-Half</h3>
                        <p className="text-blue-600/80 mb-3 flex-grow text-sm">Select two flavors</p>
                        <Button variant="primary" size="sm" className="mt-auto shadow-sm w-full">Choose Flavors</Button>
                      </div>
                    )}
                    {catItems.map((item) => {
                      const isAddingFull = addingItems.has(item._id);
                      // Determine aspect ratio based on category
                      const imageAspectRatioClass = item.category === 'drink' ? 'aspect-[3/4] max-h-48 mx-auto' : 'aspect-[16/9]';
                      
                      return (
                        <div
                          key={item._id}
                          className="border rounded-lg p-4 hover:shadow-md transition-all flex flex-col h-full bg-white group hover:-translate-y-1"
                        >
                          {item.image ? (
                            <div className={`w-full rounded-md mb-3 overflow-hidden bg-gray-50 shrink-0 shadow-sm ${imageAspectRatioClass}`}>
                              <img 
                                src={item.image} 
                                alt={item.name} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
                                }}
                              />
                            </div>
                          ) : (
                            <div className={`w-full bg-gray-100 rounded-md mb-3 flex items-center justify-center text-gray-400 shrink-0 shadow-inner ${imageAspectRatioClass}`}>
                              <span className="text-sm">No image</span>
                            </div>
                          )}
                          <h3 className="font-semibold mb-1 line-clamp-2 text-gray-800" title={item.name}>{item.name}</h3>
                          <p className="text-blue-600 font-bold mb-3 flex-grow">
                            {formatCurrency(item.price)}
                          </p>
                          <Button
                            size="sm"
                            variant="primary"
                            type="button"
                            disabled={isAddingFull}
                            onClick={(e) => {
                              openAddItemNoteModal(item, 1, e);
                            }}
                            className="w-full mt-auto shadow-sm active:scale-95 transition-transform"
                          >
                            <PlusIcon className="h-4 w-4 mr-1 inline" />
                            {isAddingFull ? 'Adding...' : 'Add'}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Floating Cart Button */}
      <button
        onClick={() => setShowCartModal(true)}
        className="fixed bottom-6 right-6 lg:bottom-10 lg:right-10 bg-blue-600 text-white p-4 rounded-full shadow-2xl hover:bg-blue-700 hover:scale-105 transition-all z-40 group focus:outline-none focus:ring-4 focus:ring-blue-300"
        aria-label="Open Order Cart"
      >
        <div className="relative">
          <ShoppingCartIcon className="h-8 w-8" />
          {order?.items?.length > 0 && (
            <span className="absolute -top-3 -right-3 bg-red-500 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full border-2 border-white shadow-sm group-hover:animate-bounce">
              {order.items.reduce((sum, item) => sum + (item.quantity === 0.5 ? 1 : item.quantity), 0)}
            </span>
          )}
        </div>
      </button>

      {/* Order Cart Modal */}
      <Modal
        isOpen={showCartModal}
        onClose={() => setShowCartModal(false)}
        title={
          <div className="flex items-center gap-2">
            <ShoppingCartIcon className="h-6 w-6 text-blue-600" />
            <span>Current Order</span>
          </div>
        }
        size="lg"
      >
        <div className="flex flex-col h-[70vh]">
          {!order || !order.items || order.items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
              <ShoppingCartIcon className="h-16 w-16 mb-4 text-gray-300" />
              <p className="text-lg">Your cart is empty</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setShowCartModal(false)}
              >
                Continue Ordering
              </Button>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto pr-2 space-y-4 mb-4 scrollbar-thin">
                {(() => {
                  const { pending, sent } = groupItemsByStatus(order.items);
                  
                  return (
                    <>
                      {/* Pending Items Section */}
                      {pending.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2 sticky top-0 bg-white py-2 z-10 border-b">
                            <ClockIcon className="h-5 w-5 text-orange-500" />
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
                                className="flex items-center justify-between border-l-4 border-orange-400 bg-orange-50/50 hover:bg-orange-50 rounded-r-lg p-3 transition-colors shadow-sm"
                              >
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <div className="font-semibold text-gray-800">
                                      {itemName}
                                      {item.quantity === 0.5 && (
                                        <span className="text-xs font-normal text-gray-500 ml-2 bg-gray-200 px-2 py-0.5 rounded-full">(Half)</span>
                                      )}
                                    </div>
                                    <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border font-medium ${getStatusBadge(getItemStatus(item)).color}`}>
                                      {getStatusBadge(getItemStatus(item)).label}
                                    </span>
                                  </div>
                                  <div className="text-sm text-gray-600 font-medium">
                                    {item.quantity === 0.5 ? '0.5' : item.quantity} × {formatCurrency(itemPrice)} = <span className="text-gray-800">{formatCurrency(itemTotal)}</span>
                                  </div>
                                  {item.note && (
                                    <div className="text-xs text-gray-500 mt-1 italic">Note: {item.note}</div>
                                  )}
                                </div>
                                <div className="flex items-center gap-4 pl-4">
                                  <span className="font-bold text-gray-900">
                                    {formatCurrency(itemTotal)}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={(e) => removeItem(item._id, e)}
                                    className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-all"
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
                        <div className="space-y-2 mt-6">
                          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2 sticky top-0 bg-white py-2 z-10 border-b">
                            <CheckCircleIcon className="h-5 w-5 text-green-600" />
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
                                className={`flex items-center justify-between border-l-4 rounded-r-lg p-3 transition-colors shadow-sm ${
                                  status === 'ready' 
                                    ? 'border-green-500 bg-green-50/50 hover:bg-green-50' 
                                    : status === 'declined'
                                    ? 'border-red-500 bg-red-50/50 hover:bg-red-50'
                                    : 'border-blue-400 bg-blue-50/30 hover:bg-blue-50'
                                } ${isLocked ? 'opacity-90' : ''}`}
                              >
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <div className={`font-semibold ${status === 'declined' ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                                      {itemName}
                                      {item.quantity === 0.5 && (
                                        <span className="text-xs font-normal text-gray-500 ml-2 bg-gray-200 px-2 py-0.5 rounded-full">(Half)</span>
                                      )}
                                    </div>
                                    <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border font-medium ${statusBadge.color}`}>
                                      {statusBadge.label}
                                    </span>
                                  </div>
                                  <div className={`text-sm font-medium ${status === 'declined' ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {item.quantity === 0.5 ? '0.5' : item.quantity} × {formatCurrency(itemPrice)} = <span className={status === 'declined' ? '' : 'text-gray-800'}>{formatCurrency(itemTotal)}</span>
                                  </div>
                                  {item.note && (
                                    <div className="text-xs text-gray-500 mt-1 italic">Note: {item.note}</div>
                                  )}
                                </div>
                                <div className="flex items-center gap-4 pl-4">
                                  <span className={`font-bold ${status === 'declined' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
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
                                    className={`p-2 rounded-full transition-all ${
                                      isLocked 
                                        ? 'text-gray-300 cursor-not-allowed' 
                                        : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
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

              <div className="border-t-2 border-gray-100 pt-4 mt-auto shrink-0 bg-white">
                <div className="flex justify-between items-end mb-4">
                  <span className="text-gray-600 font-medium">Subtotal:</span>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">
                      {formatCurrency(order.total || order.subtotal || 0)}
                    </div>
                    {order.items.some(i => getItemStatus(i) === 'declined') && (
                      <div className="text-xs text-gray-500">
                        *Declined items are not included
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="success"
                    className="w-full shadow-sm py-3 text-base"
                    onClick={() => {
                      setShowCartModal(false);
                      sendToKitchen();
                    }}
                    disabled={processing || !hasPendingItems}
                  >
                    <PaperAirplaneIcon className="h-5 w-5 mr-2 inline" />
                    {hasPendingItems ? `Send ${order.items.filter(item => getItemStatus(item) === 'pending').length} to Kitchen` : 'Kitchen Updated'}
                  </Button>
                  <Button
                    variant="primary"
                    className="w-full shadow-sm py-3 text-base"
                    onClick={() => {
                      setShowCartModal(false);
                      setShowPaymentModal(true);
                    }}
                    disabled={processing}
                  >
                    <QrCodeIcon className="h-5 w-5 mr-2 inline" />
                    Proceed to Pay
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={showAddItemModal}
        onClose={closeAddItemNoteModal}
        title="Add Note For Item"
      >
        <div className="space-y-4">
          <div className="p-3 bg-gray-50 rounded-lg border">
            <div className="font-semibold text-gray-800">{pendingAddItem?.name || 'Item'}</div>
            <div className="text-sm text-gray-600 mt-2 flex items-center justify-between">
              <span>Quantity</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={decreasePendingItemQty}
                  className="p-1 rounded border text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                  disabled={processing || (pendingAddItem?.quantity || 1) <= 1}
                  aria-label="Decrease quantity"
                >
                  <ArrowDownIcon className="h-4 w-4" />
                </button>
                <span className="min-w-8 text-center font-semibold text-gray-800">
                  {pendingAddItem?.quantity || 1}
                </span>
                <button
                  type="button"
                  onClick={increasePendingItemQty}
                  className="p-1 rounded border text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                  disabled={processing || (pendingAddItem?.quantity || 1) >= 99}
                  aria-label="Increase quantity"
                >
                  <ArrowUpIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Item note (optional)</label>
            <textarea
              value={itemNoteDraft}
              onChange={(e) => setItemNoteDraft(e.target.value)}
              placeholder="Example: no ice, less spicy, extra sauce..."
              className="w-full p-3 border rounded-lg resize-none"
              rows={3}
              maxLength={300}
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={closeAddItemNoteModal}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={confirmAddItemWithNote}
              disabled={processing}
            >
              Add To Order
            </Button>
          </div>
        </div>
      </Modal>

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
        isOpen={showHalfModal}
        onClose={() => {
          setShowHalfModal(false);
          setHalfHalfNote('');
        }}
        title="Select Half-Half Flavors"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="font-semibold mb-2">Left Half</div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {halfHalfOptions.map((opt) => (
                  <button
                    key={`left-${opt._id}`}
                    onClick={() => setHalfLeft(opt)}
                    className={`w-full p-3 border rounded-lg text-left transition-all ${halfLeft?._id === opt._id ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
                  >
                    <div className="flex justify-between">
                      <span>{opt.name}</span>
                      <span className="text-blue-600 font-medium">{formatCurrency(opt.price * 0.5)}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="font-semibold mb-2">Right Half</div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {halfHalfOptions.map((opt) => (
                  <button
                    key={`right-${opt._id}`}
                    onClick={() => setHalfRight(opt)}
                    className={`w-full p-3 border rounded-lg text-left transition-all ${halfRight?._id === opt._id ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
                  >
                    <div className="flex justify-between">
                      <span>{opt.name}</span>
                      <span className="text-blue-600 font-medium">{formatCurrency(opt.price * 0.5)}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="p-3 bg-gray-100 rounded-lg flex justify-between items-center">
            <div className="font-semibold">Total</div>
            <div className="text-blue-600 font-bold">
              {formatCurrency(((halfLeft?.price || 0) + (halfRight?.price || 0)) * 0.5)}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Note for this half-half pizza (optional)</label>
            <textarea
              value={halfHalfNote}
              onChange={(e) => setHalfHalfNote(e.target.value)}
              placeholder="Example: less cheese, no onion..."
              className="w-full p-3 border rounded-lg resize-none"
              rows={2}
            />
          </div>
          <Button
            variant="primary"
            className="w-full"
            disabled={!halfLeft || !halfRight || processing}
            onClick={async () => {
              if (!halfLeft || !halfRight) return;
              const loadingKey = `half_${halfLeft._id}_${halfRight._id}`;
              if (addingItems.has(loadingKey)) return;
              setAddingItems(prev => new Set(prev).add(loadingKey));
              try {
                let currentOrder = order;
                if (!currentOrder) {
                  currentOrder = await createOrder();
                  if (!currentOrder) {
                    setAddingItems(prev => {
                      const s = new Set(prev);
                      s.delete(loadingKey);
                      return s;
                    });
                    return;
                  }
                }
                const response = await ordersAPI.addHalfHalf(
                  currentOrder._id,
                  halfLeft._id,
                  halfRight._id,
                  halfHalfNote.trim()
                );
                if (response.success) {
                  setOrder(response.data);
                  setShowHalfModal(false);
                  setHalfHalfNote('');
                }
              } catch (error) {
                toast.error(error.message || 'Failed to add half-half pizza');
              } finally {
                setAddingItems(prev => {
                  const s = new Set(prev);
                  s.delete(loadingKey);
                  return s;
                });
              }
            }}
          >
            Add Pizza Half-Half
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={showPaymentModal}
        onClose={closePaymentModal}
        title="Select Payment Method"
        size={selectedPaymentMethod === 'momo' ? 'lg' : 'md'}
      >
        <div className="space-y-4">
          {PAYMENT_METHODS.map((method) => {
            const IconComponent = paymentIcons[method.value];
            return (
              <button
                key={method.value}
                onClick={() => handleSelectPaymentMethod(method.value)}
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
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setDiscountType('percent')}
              className={`w-full p-3 border rounded-lg transition-all ${
                discountType === 'percent' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              Percent
            </button>
            <button
              onClick={() => setDiscountType('amount')}
              className={`w-full p-3 border rounded-lg transition-all ${
                discountType === 'amount' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              Amount
            </button>
            <button
              onClick={() => {
                setDiscountType(null);
                setDiscountValue('');
                setDiscountReason('');
              }}
              className={`w-full p-3 border rounded-lg transition-all ${
                discountType === null ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              No Discount
            </button>
          </div>
          {discountType && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <input
                  type="number"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  placeholder={discountType === 'percent' ? 'Enter % (0-100)' : 'Enter amount'}
                  className="w-full p-3 border rounded-lg"
                  min="0"
                  max={discountType === 'percent' ? '100' : undefined}
                />
              </div>
              <div>
                <input
                  type="text"
                  value={discountReason}
                  onChange={(e) => setDiscountReason(e.target.value)}
                  placeholder="Reason (optional)"
                  className="w-full p-3 border rounded-lg"
                />
              </div>
            </div>
          )}
          <div className="p-4 bg-gray-100 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="font-semibold">Subtotal</span>
              <span>{formatCurrency(getPayableSubtotalPreview())}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">Discount</span>
              <span>
                {formatCurrency(getDiscountPreview())}
              </span>
            </div>
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>
                {formatCurrency(getTotalPreview())}
              </span>
            </div>
          </div>

          {selectedPaymentMethod === 'momo' && (
            <div className="p-4 border border-pink-200 rounded-lg bg-pink-50">
              <div className="text-center mb-3">
                <p className="font-semibold text-gray-800">MoMo QR Payment</p>
                <p className="text-sm text-gray-600">Scan QR with MoMo app to pay this bill</p>
              </div>
              <div className="flex justify-center">
                {momoQrUrl ? (
                  <img
                    src={momoQrUrl}
                    alt="MoMo QR"
                    className="w-64 h-64 object-contain border rounded-lg bg-white p-2"
                  />
                ) : (
                  <div className="w-64 h-64 border rounded-lg bg-white p-4 flex items-center justify-center text-center text-sm text-gray-500">
                    {momoLoading ? 'Creating QR...' : 'QR is not available yet'}
                  </div>
                )}
              </div>
              {momoPayUrl && (
                <div className="mt-3 text-center">
                  <a
                    href={momoPayUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline text-sm font-medium"
                  >
                    Open MoMo payment link
                  </a>
                </div>
              )}
              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Status: {momoPaymentStatus === 'paid' ? 'Paid' : momoPaymentStatus === 'pending' ? 'Waiting for payment' : momoPaymentStatus === 'failed' ? 'Failed' : 'Not started'}
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={momoLoading || processing}
                  onClick={createMomoQr}
                >
                  {momoLoading ? 'Generating...' : 'Regenerate QR'}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

          <div className="flex gap-2 mt-4">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={closePaymentModal}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              className="flex-1"
          onClick={async () => {
            if (!selectedPaymentMethod || !order) {
              if (!selectedPaymentMethod) toast.warning('Please select payment method');
              return;
            }
            const subtotal = getPayableSubtotalPreview();
            if (discountType === 'percent') {
              const v = Number(discountValue);
              if (isNaN(v) || v < 0 || v > 100) {
                toast.warning('Percent must be between 0 and 100');
                return;
              }
            }
            if (discountType === 'amount') {
              const v = Number(discountValue);
              if (isNaN(v) || v < 0 || v > subtotal) {
                toast.warning('Amount cannot exceed subtotal');
                return;
              }
            }
            setProcessing(true);
            try {
              if (discountType) {
                await ordersAPI.update(order._id, {
                  discountType,
                  discountValue: Number(discountValue) || 0,
                  discountReason: discountReason || ''
                });
                const refreshed = await ordersAPI.getById(order._id);
                if (refreshed.success) {
                  setOrder(refreshed.data);
                }
              }
              if (selectedPaymentMethod === 'momo') {
                if (momoPaymentStatus !== 'paid') {
                  toast.warning('Please complete MoMo payment before confirm');
                  return;
                }

                const paidOrderRes = await ordersAPI.getById(order._id);
                if (!paidOrderRes.success || paidOrderRes.data?.status !== 'paid') {
                  toast.warning('Waiting for payment confirmation');
                  return;
                }

                toast.success('Payment processed successfully');
                closePaymentModal();
                setOrder(null);
                setDiscountType(null);
                setDiscountValue('');
                setDiscountReason('');
                navigate(`/tables?${getNavigateParams()}`);
                return;
              }

              const response = await paymentAPI.processPayment(order._id, selectedPaymentMethod);
              if (response.success) {
                toast.success('Payment processed successfully');
                closePaymentModal();
                setOrder(null);
                setDiscountType(null);
                setDiscountValue('');
                setDiscountReason('');
                navigate(`/tables?${getNavigateParams()}`);
              }
            } catch (error) {
              toast.error(error.message || 'Payment failed');
            } finally {
              setProcessing(false);
            }
          }}
          disabled={!selectedPaymentMethod || processing || momoLoading}
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
