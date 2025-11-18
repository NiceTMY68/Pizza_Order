import { RectangleStackIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Button from '../common/Button';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <RectangleStackIcon className="h-8 w-8" />
          <h1 className="text-2xl font-bold">Pizza Order System</h1>
        </div>
        {user && (
          <div className="flex items-center space-x-4">
            <span className="text-sm">
              Welcome, <span className="font-semibold">{user.name}</span>
            </span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <ArrowRightOnRectangleIcon className="h-4 w-4 mr-1 inline" />
              Logout
            </Button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
