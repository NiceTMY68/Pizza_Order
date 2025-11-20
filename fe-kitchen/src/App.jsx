import { useCallback, useEffect, useMemo, useState } from 'react';
import { BellIcon, BellSlashIcon } from '@heroicons/react/24/outline';
import { kitchenAPI } from './api/kitchen';
import OrderRow from './components/OrderRow';
import ConfirmDialog from './components/ConfirmDialog';
import { useInterval } from './hooks/useInterval';
import { useNewItemsDetector } from './hooks/useNewItemsDetector';
import { formatClock } from './utils/time';
import { testBellSound } from './utils/sound';

const GROUP_LABELS = {
  default: 'Kitchen 1 Orders'
};

const App = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyItemId, setBusyItemId] = useState(null);
  const [declineTarget, setDeclineTarget] = useState(null);
  const [clock, setClock] = useState(formatClock());
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('kitchenSoundEnabled');
    return saved !== null ? saved === 'true' : true; // Default to enabled
  });

  useNewItemsDetector(items, soundEnabled);

  const fetchItems = useCallback(async () => {
    try {
      const response = await kitchenAPI.getPending();
      setItems(response.data || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useInterval(fetchItems, 5000);
  useInterval(() => setClock(formatClock()), 1000);

  const groupedItems = useMemo(() => {
    return [
      {
        label: GROUP_LABELS.default,
        data: items
      }
    ];
  }, [items]);

  const handleReady = async (record) => {
    try {
      setBusyItemId(record.item.id);
      await kitchenAPI.markReady(record.orderId, record.item.id);
      await fetchItems();
    } catch (err) {
      setError(err.message || 'Failed to update item');
    } finally {
      setBusyItemId(null);
    }
  };

  const handleDecline = (record) => {
    setDeclineTarget(record);
  };

  const confirmDecline = async () => {
    if (!declineTarget) return;
    try {
      setBusyItemId(declineTarget.item.id);
      await kitchenAPI.decline(declineTarget.orderId, declineTarget.item.id);
      await fetchItems();
    } catch (err) {
      setError(err.message || 'Failed to decline item');
    } finally {
      setDeclineTarget(null);
      setBusyItemId(null);
    }
  };

  const toggleSound = () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    localStorage.setItem('kitchenSoundEnabled', newValue.toString());
    if (newValue) {
      testBellSound();
    }
  };

  const handleTestSound = () => {
    testBellSound();
  };

  return (
    <div className="min-h-screen px-6 sm:px-12 py-8">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl sm:text-5xl font-bold text-yellow-300 tracking-wide">
            {GROUP_LABELS.default}
          </h1>
          <p className="text-slate-200 text-lg">Orders sent from supervisor tablets</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleTestSound}
            className="px-4 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-white font-semibold text-sm shadow-md shadow-yellow-500/30 flex items-center gap-2"
            title="Test bell sound"
          >
            <BellIcon className="h-5 w-5" />
            Test Sound
          </button>
          <button
            onClick={toggleSound}
            className={`px-4 py-2 rounded-lg font-semibold text-sm shadow-md flex items-center gap-2 transition-colors ${
              soundEnabled
                ? 'bg-green-500 hover:bg-green-400 text-white shadow-green-500/30'
                : 'bg-gray-600 hover:bg-gray-500 text-white shadow-gray-500/30'
            }`}
            title={soundEnabled ? 'Sound notifications enabled' : 'Sound notifications disabled'}
          >
            {soundEnabled ? (
              <>
                <BellIcon className="h-5 w-5" />
                Sound On
              </>
            ) : (
              <>
                <BellSlashIcon className="h-5 w-5" />
                Sound Off
              </>
            )}
          </button>
          <button
            onClick={() => alert('Trash view coming soon')}
            className="px-6 py-3 rounded-xl bg-pink-500 hover:bg-pink-400 text-white font-semibold text-lg shadow-md shadow-pink-500/30"
          >
            View Trash
          </button>
          <div className="text-3xl font-bold text-white font-display">{clock}</div>
        </div>
      </header>

      {error && (
        <div className="mb-4 bg-red-600/40 border border-red-400 text-white px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center text-slate-200 text-2xl mt-24">Loading orders...</div>
      ) : (
        groupedItems.map((group) => (
          <section key={group.label} className="space-y-4">
            <h2 className="text-3xl font-semibold text-white uppercase tracking-widest">
              {group.label}
            </h2>
            {group.data.length === 0 ? (
              <div className="bg-slate-800/70 border border-slate-700 rounded-2xl p-8 text-center text-slate-300 text-xl">
                No pending items
              </div>
            ) : (
              <div className="space-y-3">
                {group.data.map((record) => (
                  <OrderRow
                    key={`${record.orderId}-${record.item.id}`}
                    record={record}
                    onReady={handleReady}
                    onDecline={handleDecline}
                    busy={busyItemId === record.item.id}
                  />
                ))}
              </div>
            )}
          </section>
        ))
      )}

      <ConfirmDialog
        open={Boolean(declineTarget)}
        title="Decline order item?"
        message="Are you sure you want to decline this item? The supervisor will be notified."
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        onConfirm={confirmDecline}
        onCancel={() => setDeclineTarget(null)}
      />
    </div>
  );
};

export default App;

