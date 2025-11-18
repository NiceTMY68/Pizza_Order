import { useEffect } from 'react';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ExclamationTriangleIcon, 
  InformationCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const Toast = ({ message, type = 'info', onClose, duration = 3000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const types = {
    success: {
      bg: 'bg-green-500',
      icon: CheckCircleIcon,
    },
    error: {
      bg: 'bg-red-500',
      icon: XCircleIcon,
    },
    warning: {
      bg: 'bg-yellow-500',
      icon: ExclamationTriangleIcon,
    },
    info: {
      bg: 'bg-blue-500',
      icon: InformationCircleIcon,
    },
  };

  const { bg, icon: Icon } = types[type];

  return (
    <div className={`${bg} text-white px-6 py-4 rounded-lg shadow-lg flex items-center justify-between min-w-[300px]`}>
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5" />
        <span>{message}</span>
      </div>
      <button onClick={onClose} className="ml-4 text-white hover:text-gray-200">
        <XMarkIcon className="h-5 w-5" />
      </button>
    </div>
  );
};

export default Toast;
