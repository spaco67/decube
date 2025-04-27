import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { login, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      redirectBasedOnRole(user.role);
    }
  }, [user]);

  const redirectBasedOnRole = (role: string) => {
    switch (role) {
      case "waiter":
        navigate("/waiter");
        break;
      case "barman":
        navigate("/barman");
        break;
      case "kitchen":
        navigate("/kitchen");
        break;
      case "admin":
        navigate("/admin");
        break;
      case "accountant":
        navigate("/accountant");
        break;
      default:
        navigate("/");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const userData = await login(email, password);
      if (!userData) {
        throw new Error("Login failed. Please try again.");
      }
      redirectBasedOnRole(userData.role);
    } catch (err: any) {
      if (err.message.includes("Invalid login credentials")) {
        setError("Invalid email or password. Please try again.");
      } else {
        setError(err.message || "Failed to login");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl overflow-hidden">
          <div className="px-8 py-6 bg-teal-600 dark:bg-teal-700">
            <div className="flex items-center justify-center mb-4">
              <img
                src="https://images.unsplash.com/photo-1745596703704-8454fc9b04df?q=80&w=64&auto=format&fit=crop"
                alt="DECUBE Logo"
                className="w-16 h-16 rounded-full shadow-lg border-2 border-white"
              />
            </div>
            <h1 className="text-2xl font-bold text-center text-white">
              DECUBE
            </h1>
            <p className="text-teal-100 text-center">
              Bar & Restaurant Management
            </p>
          </div>

          <div className="px-8 py-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6 text-center">
              Sign in to your account
            </h2>

            {error && (
              <div className="mb-4 p-3 rounded-md bg-red-100 border border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-900/30 dark:text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500 dark:bg-gray-700 dark:text-white"
                  placeholder="your.email@example.com"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500 dark:bg-gray-700 dark:text-white"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors ${
                    isLoading ? "opacity-70 cursor-not-allowed" : ""
                  }`}
                >
                  {isLoading ? "Signing in..." : "Sign in"}
                </button>
              </div>
            </form>
          </div>
        </div>
        <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
          Developed with ❤️ by{" "}
          <a
            href="https://zeustek.ng/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-teal-600 hover:text-teal-700 dark:text-teal-500 dark:hover:text-teal-400"
          >
            Zeustek Hub
          </a>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
