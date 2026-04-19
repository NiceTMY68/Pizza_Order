export const SUPERVISORS = [
  { id: '1', name: 'Sơn', username: 'son' },
  { id: '2', name: 'Loan', username: 'loan' },
  { id: '3', name: 'Bích Ngọc', username: 'bichngoc' },
  { id: '4', name: 'Nhật', username: 'nhat' },
  { id: '5', name: 'Vũ', username: 'vu' },
  { id: '6', name: 'Long', username: 'long' },
];

export const TABLE_STATUS_COLORS = {
  available: 'bg-red-500 hover:bg-red-600',
  occupied: 'bg-green-500 hover:bg-green-600',
  reserved: 'bg-yellow-500 hover:bg-yellow-600',
};

export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash', icon: '💵' },
  { value: 'momo', label: 'MoMo QR', icon: '📱' },
];

export const MENU_CATEGORIES = {
  drink: 'Drinks',
  pizza: 'Pizza',
  pasta: 'Pasta',
};

export const ORDER_STATUS = {
  draft: 'Draft',
  sent_to_kitchen: 'Sent to Kitchen',
  cooking: 'Cooking',
  ready: 'Ready',
  completed: 'Completed',
  cancelled: 'Cancelled',
};
