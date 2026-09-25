import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Shield } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-pink-50 to-white">
      <div
        className="text-center p-8 rounded-3xl border border-white/40 shadow-xl"
        style={{
          background: 'rgba(255, 255, 255, 0.3)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className="w-20 h-20 rounded-full bg-pink-100 flex items-center justify-center mx-auto mb-4">
          <Shield className="w-10 h-10 text-pink-500" />
        </div>
        <h1 className="mb-2 text-5xl font-bold text-pink-600">404</h1>
        <p className="mb-6 text-lg text-gray-500">Oops! Page not found</p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-pink-500 text-white rounded-full font-medium hover:bg-pink-600 transition-all"
        >
          Return to SAHA
        </button>
      </div>
    </div>
  );
};

export default NotFound;