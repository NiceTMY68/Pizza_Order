import { TABLE_STATUS_COLORS } from '../../utils/constants';
import { useToast } from '../../context/ToastContext';

const TableCard = ({ table, onClick }) => {
  const statusColor = TABLE_STATUS_COLORS[table.status] || 'bg-gray-500';
  const toast = useToast();

  const handleCardClick = () => {
    if (table.status === 'available') {
      onClick();
    } else if (table.status === 'occupied') {
      onClick();
    } else {
      toast.warning('Cannot access reserved table. Please change status first.');
    }
  };
  
  return (
    <div
      onClick={handleCardClick}
      className={`${statusColor} text-white rounded-lg p-4 cursor-pointer transition-all duration-200 transform hover:scale-105 shadow-lg min-h-[100px] flex flex-col justify-center`}
    >
      <div className="text-center">
        <div className="text-2xl font-bold mb-1">
          {table.type === 'takeaway' 
            ? table.tableNumber 
            : table.type === 'pizza_bar'
            ? 'Pizza Bar'
            : `Table ${table.tableNumber}`}
        </div>
        <div className="text-sm opacity-90 capitalize">{table.status}</div>
      </div>
    </div>
  );
};

export default TableCard;
