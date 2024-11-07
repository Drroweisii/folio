import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { login, googleLogin } from '../services/auth';
import Input from '../components/forms/Input';
import Button from '../components/forms/Button';
import { LogIn } from 'lucide-react';

declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement, config: any) => void;
          prompt: () => void;
        };
      };
    };
  }
}

export default function Login() {
  const navigate = useNavigate();
  const { login: setUser } = useAuth();
  const [formData, setFormData] = React.useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [googleError, setGoogleError] = React.useState<string | null>(null);

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      setUser(data.user);
      navigate('/', { replace: true });
    },
    onError: (error: any) => {
      setErrors({
        submit: error.message || 'Login failed. Please try again.',
      });
    },
  });

  const googleLoginMutation = useMutation({
    mutationFn: googleLogin,
    onSuccess: (data) => {
      setUser(data.user);
      navigate('/', { replace: true });
    },
    onError: (error: any) => {
      setGoogleError(error.message || 'Google Sign-In failed. Please try again.');
    },
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      loginMutation.mutate(formData);
    }
  };

  const handleGoogleCallback = async (response: any) => {
    try {
      const { credential } = response;
      if (!credential) {
        throw new Error('No credential received from Google');
      }
      googleLoginMutation.mutate(credential);
    } catch (error: any) {
      setGoogleError('Google Sign-In failed. Please try again.');
      console.error('Google Sign-In error:', error);
    }
  };

  useEffect(() => {
    if (window.google?.accounts?.id) {
      window.google.accounts.id.initialize({
        client_id: '309222170594-80tfthgu4i0s7iub3t9ojqgi3dctcbla.apps.googleusercontent.com',
        callback: handleGoogleCallback,
      });

      const googleButtonDiv = document.getElementById('google-signin-btn');
      if (googleButtonDiv) {
        window.google.accounts.id.renderButton(googleButtonDiv, {
          theme: 'filled_black',
          size: 'large',
          width: 250,
          text: 'signin_with',
        });
      }
    }
  }, []);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-[#0a0a0a] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-red-900/30">
            <LogIn className="h-6 w-6 text-red-500" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Sign in to your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Input
              label="Email address"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              error={errors.email}
              disabled={loginMutation.isPending}
              className="bg-gray-900 border-gray-700 text-white"
            />
            <Input
              label="Password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              error={errors.password}
              disabled={loginMutation.isPending}
              className="bg-gray-900 border-gray-700 text-white"
            />
          </div>

          {errors.submit && (
            <div className="text-sm text-red-500 text-center">
              {errors.submit}
            </div>
          )}

          {googleError && (
            <div className="text-sm text-red-500 text-center">
              {googleError}
            </div>
          )}

          <Button
            type="submit"
            isLoading={loginMutation.isPending}
            disabled={loginMutation.isPending}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
          >
            Sign in
          </Button>

          <div className="text-sm text-center">
            <span className="text-gray-400">Don't have an account? </span>
            <Link
              to="/register"
              className="font-medium text-red-500 hover:text-red-400"
            >
              Sign up
            </Link>
          </div>

          <div className="mt-4 flex justify-center">
            <div id="google-signin-btn"></div>
          </div>
        </form>
      </div>
    </div>
  );
}