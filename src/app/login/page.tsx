"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const [tenantId, setTenantId] = useState("");
  const [tenantName, setTenantName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Get tenantId from headers that were set by proxy
  useEffect(() => {
    const getTenantInfo = async () => {
      try {
        const response = await fetch("/api/tenant/current");
        if (response.ok) {
          const data = await response.json();
          setTenantId(data.id);
          setTenantName(data.name);
        }
      } catch (err) {
        console.error("Failed to get tenant info:", err);
      }
    };

    getTenantInfo();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!tenantId) {
      setError(
        "Unable to determine tenant. Please access from a valid subdomain.",
      );
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, tenantId }),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        setError(result.error || "An error occurred");
      } else {
        router.push("/admin");
      }
    } catch {
      setError("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-bold text-center mb-2 text-slate-900">
            Admin Panel
          </h1>
          {tenantName && (
            <p className="text-center text-sm text-slate-600 mb-6">
              {tenantName}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Username
              </label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                disabled={loading || !tenantId}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Password
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                disabled={loading || !tenantId}
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || !tenantId}
              className="w-full"
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>

            {!tenantId && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded text-sm">
                Loading tenant information...
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
