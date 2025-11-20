import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BuildingOffice2Icon, ShoppingBagIcon, FireIcon } from '@heroicons/react/24/outline';
import { tablesAPI } from '../api/tables';
import TableCard from '../components/ui/TableCard';
import Button from '../components/common/Button';
import Header from '../components/layout/Header';
import { useToast } from '../context/ToastContext';

const Floor1Layout = ({ tables, onTableClick }) => {
  const pizzaBar = tables.find(t => t.type === 'pizza_bar');
  const regularTables = tables.filter(t => t.type === 'table');
  
  const table31 = regularTables.find(t => t.tableNumber === '31');
  const tables32_35 = regularTables.filter(t => ['32', '33', '34', '35'].includes(t.tableNumber));
  const tables1_3 = regularTables.filter(t => ['1', '2', '3'].includes(t.tableNumber));
  const tables4_6 = regularTables.filter(t => ['4', '5', '6'].includes(t.tableNumber));

  return (
    <div className="w-full bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-6 md:p-12 border-4 border-amber-200">
      <div className="grid grid-cols-12 gap-4 md:gap-6 min-h-[700px]">
        <div className="col-span-2 flex flex-col gap-4 justify-center">
          {tables1_3.map((table) => (
            <TableCard
              key={table._id}
              table={table}
              onClick={() => onTableClick(table)}
            />
          ))}
        </div>

        <div className="col-span-8 flex flex-col">
          <div className="flex items-start gap-3 mb-4 justify-center">
            {table31 && (
              <TableCard
                table={table31}
                onClick={() => onTableClick(table31)}
              />
            )}

            {tables32_35.map((table) => (
              <TableCard
                key={table._id}
                table={table}
                onClick={() => onTableClick(table)}
              />
            ))}
          </div>

          <div className="flex-1 flex items-center justify-center relative my-4">
            <div className="relative z-10">
              <div className="bg-gradient-to-br from-orange-400 to-red-500 rounded-full p-6 md:p-10 shadow-2xl border-4 border-orange-600 animate-pulse mb-4 mx-auto w-fit">
                <FireIcon className="h-12 w-12 md:h-16 md:w-16 text-white" />
              </div>
              {pizzaBar && (
                <div className="w-40 mx-auto">
                  <TableCard
                    table={pizzaBar}
                    onClick={() => onTableClick(pizzaBar)}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-span-2 flex flex-col gap-4 justify-center">
          {tables4_6.map((table) => (
            <TableCard
              key={table._id}
              table={table}
              onClick={() => onTableClick(table)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const Floor2Layout = ({ tables, onTableClick }) => {
  const regularTables = tables.filter(t => t.type === 'table');
  const tables43_21_22 = regularTables.filter(t => ['43', '21', '22'].includes(t.tableNumber));
  const tables41_42 = regularTables.filter(t => ['41', '42'].includes(t.tableNumber));
  const tables23_26 = regularTables.filter(t => ['23', '24', '25', '26'].includes(t.tableNumber));

  return (
    <div className="w-full bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 md:p-12 border-4 border-blue-200">
      <div className="grid grid-cols-12 gap-4 md:gap-6 min-h-[600px]">
        <div className="col-span-3 flex flex-col gap-4 justify-center">
          {tables43_21_22.map((table) => (
            <TableCard
              key={table._id}
              table={table}
              onClick={() => onTableClick(table)}
            />
          ))}
        </div>

        <div className="col-span-6 flex flex-col items-center justify-center gap-4">
          <div className="flex gap-3 justify-center">
            {tables41_42.map((table) => (
              <TableCard
                key={table._id}
                table={table}
                onClick={() => onTableClick(table)}
              />
            ))}
          </div>
        </div>

        <div className="col-span-3 flex flex-col gap-4 justify-center">
          {tables23_26.map((table) => (
            <TableCard
              key={table._id}
              table={table}
              onClick={() => onTableClick(table)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const TakeAwayLayout = ({ tables, onTableClick }) => {
  const sortedTables = [...tables.filter(t => t.type === 'takeaway')].sort((a, b) => {
    const numA = parseInt(a.tableNumber.replace('TA ', ''));
    const numB = parseInt(b.tableNumber.replace('TA ', ''));
    return numA - numB;
  });

  return (
    <div className="w-full bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 md:p-12 border-4 border-green-200">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 min-h-[400px]">
        {sortedTables.map((table) => (
          <TableCard
            key={table._id}
            table={table}
            onClick={() => onTableClick(table)}
          />
        ))}
      </div>
    </div>
  );
};

const Tables = () => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [currentFloor, setCurrentFloor] = useState(() => {
    const floor = searchParams.get('floor');
    return floor ? parseInt(floor) : (localStorage.getItem('lastFloor') ? parseInt(localStorage.getItem('lastFloor')) : 1);
  });

  const [viewType, setViewType] = useState(() => {
    const view = searchParams.get('view');
    return view || localStorage.getItem('lastViewType') || 'floor';
  });

  useEffect(() => {
    const params = new URLSearchParams();
    if (viewType === 'floor') {
      params.set('floor', currentFloor.toString());
      params.set('view', 'floor');
    } else {
      params.set('view', 'takeaway');
    }
    setSearchParams(params, { replace: true });
    localStorage.setItem('lastFloor', currentFloor.toString());
    localStorage.setItem('lastViewType', viewType);
  }, [currentFloor, viewType, setSearchParams]);

  useEffect(() => {
    const floor = searchParams.get('floor');
    const view = searchParams.get('view');
    if (floor) {
      const floorNum = parseInt(floor);
      if (floorNum !== currentFloor) {
        setCurrentFloor(floorNum);
      }
    }
    if (view && view !== viewType) {
      setViewType(view);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchTables();
  }, [currentFloor, viewType]);

  const fetchTables = async () => {
    setLoading(true);
    try {
      const response = viewType === 'takeaway' 
        ? await tablesAPI.getTakeaway()
        : await tablesAPI.getByFloor(currentFloor);
      
      if (response.success) {
        setTables(response.data);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleTableClick = (table) => {
    navigate(`/order/${table._id}`, { 
      state: { floor: currentFloor, viewType } 
    });
  };

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
        <div className="mb-6 flex flex-wrap gap-2">
          <Button
            variant={viewType === 'floor' && currentFloor === 1 ? 'primary' : 'secondary'}
            onClick={() => {
              setViewType('floor');
              setCurrentFloor(1);
            }}
          >
            <BuildingOffice2Icon className="h-4 w-4 mr-1 inline" />
            Floor 1
          </Button>
          <Button
            variant={viewType === 'floor' && currentFloor === 2 ? 'primary' : 'secondary'}
            onClick={() => {
              setViewType('floor');
              setCurrentFloor(2);
            }}
          >
            <BuildingOffice2Icon className="h-4 w-4 mr-1 inline" />
            Floor 2
          </Button>
          <Button
            variant={viewType === 'takeaway' ? 'primary' : 'secondary'}
            onClick={() => setViewType('takeaway')}
          >
            <ShoppingBagIcon className="h-4 w-4 mr-1 inline" />
            Take Away
          </Button>
        </div>

        {viewType === 'floor' && currentFloor === 1 ? (
          <Floor1Layout
            tables={tables}
            onTableClick={handleTableClick}
          />
        ) : viewType === 'floor' && currentFloor === 2 ? (
          <Floor2Layout
            tables={tables}
            onTableClick={handleTableClick}
          />
        ) : viewType === 'takeaway' ? (
          <TakeAwayLayout
            tables={tables}
            onTableClick={handleTableClick}
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {tables.map((table) => (
              <TableCard
                key={table._id}
                table={table}
                onClick={() => handleTableClick(table)}
              />
            ))}
          </div>
        )}

        {tables.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No tables available
          </div>
        )}
      </div>
    </div>
  );
};

export default Tables;
