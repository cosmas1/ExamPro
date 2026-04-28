import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/student');
      }
    }
  }, [user, loading, navigate]);

  return (
    <div className="h-[calc(100vh-64px)] flex items-center justify-center">
      <div className="text-center font-mono text-sm animate-pulse">
        ROUTING_USER_SESSION...
      </div>
    </div>
  );
}
