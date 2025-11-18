import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCircleIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import { SUPERVISORS } from '../utils/constants';
import Button from '../components/common/Button';

const Login = () => {
  const [selectedSupervisor, setSelectedSupervisor] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate('/tables', { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!selectedSupervisor) {
      setError('Please select a supervisor');
      return;
    }

    if (!password) {
      setError('Please enter password');
      return;
    }

    setLoading(true);
    const result = await login(selectedSupervisor, password);
    setLoading(false);

    if (result.success) {
      navigate('/tables', { replace: true });
    } else {
      setError(result.message || 'Login failed');
    }
  };

  if (authLoading || isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-100 p-4 rounded-full">
              <UserCircleIcon className="h-12 w-12 text-blue-600" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Pizza Order System</h2>
          <p className="text-gray-600">Please login to continue</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Supervisor
            </label>
            <div className="relative">
              <UserCircleIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={selectedSupervisor}
                onChange={(e) => setSelectedSupervisor(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              >
                <option value="">-- Select Supervisor --</option>
                {SUPERVISORS.map((supervisor) => (
                  <option key={supervisor.id} value={supervisor.username}>
                    {supervisor.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <LockClosedIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Default password: 123456</p>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Login;
