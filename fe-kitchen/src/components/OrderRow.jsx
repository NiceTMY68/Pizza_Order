import { formatDuration } from '../utils/time';

const getTableLabel = (table) => {
  if (!table) return 'Unknown';
  if (table.type === 'takeaway') {
    return table.tableNumber || 'Take Away';
  }
  if (table.type === 'pizza_bar') {
    return 'Pizza Bar';
  }
  return table.tableNumber ? `Table ${table.tableNumber}` : 'Walk-in';
};

const statusColors = {
  pending: 'bg-yellow-500 text-black',
  sent: 'bg-sky-500 text-white',
  cooking: 'bg-orange-500 text-white'
};

const OrderRow = ({ record, onReady, onDecline, busy }) => {
  const tableLabel = getTableLabel(record.table);
  const quantity = record.item.quantity % 1 === 0 ? record.item.quantity : `${record.item.quantity}`;
  const elapsed = formatDuration(record.item.sentAt);
  const statusClass = statusColors[record.item.status] || 'bg-slate-500 text-white';

  return (
    <div className="flex items-center gap-3 bg-[rgba(14,41,83,0.85)] border border-slate-700 rounded-xl px-4 py-3 shadow-lg">
      <button
        onClick={() => onDecline(record)}
        className="w-12 h-12 rounded-lg bg-red-600 hover:bg-red-500 text-2xl font-bold text-white transition-colors"
        disabled={busy}
      >
        D
      </button>
      <div className="w-16 text-center">
        <p className="text-lg font-bold text-white">{quantity}x</p>
        <span className={`text-xs px-2 py-0.5 rounded-full uppercase tracking-wide ${statusClass}`}>
          {record.item.status}
        </span>
      </div>
      <div className="flex-1">
        <p className="text-2xl font-semibold text-yellow-300">{record.item.name}</p>
        {record.item.note && <p className="text-sm text-amber-200">N: {record.item.note}</p>}
      </div>
      <div className="flex flex-col items-center min-w-[120px]">
        <span className="text-base font-semibold text-white mb-1 px-3 py-1 rounded-full bg-emerald-600/80">
          {tableLabel}
        </span>
        <span className="text-sm text-slate-200">{elapsed}</span>
      </div>
      <button
        onClick={() => onReady(record)}
        className="w-12 h-12 rounded-lg bg-green-500 hover:bg-green-400 text-2xl font-bold text-white transition-colors disabled:bg-green-900"
        disabled={busy}
      >
        R
      </button>
    </div>
  );
};

export default OrderRow;

