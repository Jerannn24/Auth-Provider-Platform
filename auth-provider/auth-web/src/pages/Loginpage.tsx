import { useState } from "react";
import { Navigate } from "react-router-dom";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [mfaPendingToken, setMfaPendingToken] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const params = new URLSearchParams(window.location.search);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setError("Email dan password harus diisi.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:8080/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Login gagal.");
        return;
      }

      if (data.mfa_required) {
        setMfaPendingToken(data.mfa_pending_token);
      } else {
        window.location.href = `http://localhost:8080/authorize?${params.toString()}`;
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Terjadi kesalahan saat login.");
    } finally {
      setLoading(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!totpCode || totpCode.length !== 6) {
      setError("Kode TOTP harus terdiri dari 6 digit.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:8080/login/mfa", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mfa_pending_token: mfaPendingToken,
          code: totpCode,
        }),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Verifikasi kode MFA gagal.");
        return;
      }

      window.location.href = `http://localhost:8080/authorize?${params.toString()}`;
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Terjadi kesalahan saat verifikasi MFA.");
    } finally {
      setLoading(false);
    }
  };

  if (!params.has("client_id") || !params.has("redirect_uri")) {
    return <Navigate to="/logout" replace />;
  }

  return (
    <div className="min-h-screen from-blue-600 via-indigo-600 to-purple-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="mt-4 text-3xl font-bold text-gray-900">
              Auth Provider
            </h1>
            <p className="mt-2 text-gray-500">
              {mfaPendingToken
                ? "Masukkan kode dari Google Authenticator"
                : "Login untuk melanjutkan"}
            </p>
          </div>

          {error && (
            <div className="mb-5 bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg">
              {error}
            </div>
          )}

          {!mfaPendingToken ? (
            /* TAMPILAN 1: Email & Password */
            <form onSubmit={handleLoginSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 rounded-lg font-medium transition"
              >
                {loading ? "Memproses..." : "Login"}
              </button>
            </form>
          ) : (
            /* TAMPILAN 2: Kode 6-Digit Google Authenticator */
            <form onSubmit={handleMfaSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
                  Kode Authenticator
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={totpCode}
                  onChange={(e) =>
                    setTotpCode(e.target.value.replace(/\D/g, ""))
                  }
                  placeholder="123456"
                  autoFocus
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center tracking-[0.5em] text-2xl font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <button
                type="submit"
                disabled={loading || totpCode.length !== 6}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 rounded-lg font-medium transition"
              >
                {loading ? "Memverifikasi..." : "Verifikasi TOTP"}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMfaPendingToken(null);
                    setTotpCode("");
                    setError("");
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  Kembali ke login password
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}