"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function MfaEnablePage() {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secretKey, setSecretKey] = useState<string>("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const fetchSetupQr = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch("http://localhost:8080/mfa/setup", {
          method: "POST",
          credentials: "include", 
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Gagal memuat QR Code MFA.");
        }

        setQrCode(data.qr_code);
        setSecretKey(data.secret_key);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Terjadi kesalahan saat meminta QR Code.");
      } finally {
        setLoading(false);
      }
    };

    fetchSetupQr();
  }, []);

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code || code.length !== 6) {
      setError("Masukkan 6 digit kode dari aplikasi Google Authenticator.");
      return;
    }

    setLoading(true);
    setError("");

    try {
        console.log("Verifying MFA code:", code);
        const response = await fetch("http://localhost:8080/mfa/verify", {
            method: "POST",
            headers: {
            "Content-Type": "application/json",
            },
            body: JSON.stringify({ code }),
            credentials: "include",
        });

        const data = await response.json();

        if (!response.ok) {
            setError(data.error || "Verifikasi kode MFA gagal.");
            return;
        }

        setSuccess(true);
        } catch (err: any) {
        console.error(err);
        setError(err.message || "Terjadi kesalahan koneksi.");
        } finally {
        setLoading(false);
        }
  };

  return (
    <div className="min-h-screen from-blue-600 via-indigo-600 to-purple-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Aktivasi Google Authenticator
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Pindai QR Code di bawah menggunakan aplikasi Google Authenticator di HP Anda.
          </p>
        </div>

        {error && (
          <div className="mb-5 bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg">
            {error}
          </div>
        )}

        {success ? (
          <div className="text-center space-y-5">
            <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl font-medium">
              ✓ Google Authenticator Berhasil Diaktifkan!
            </div>
            <button
              onClick={() => router.push("/dashboard")}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition shadow-md"
            >
              Ke Dashboard
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {loading && !qrCode ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-500 space-y-2">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm">Membuat QR Code...</span>
              </div>
            ) : (
              qrCode && (
                <div className="text-center space-y-3">
                  <div className="inline-block p-4 bg-white rounded-2xl border-2 border-gray-100 shadow-md">
                    <Image
                      src={qrCode}
                      alt="Google Authenticator QR Code"
                      className="w-48 h-48 block mx-auto object-contain"
                    />
                  </div>
                  <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-500 font-medium">Kunci Manual (Secret):</p>
                    <p className="text-xs text-gray-800 font-mono font-bold tracking-wider select-all mt-0.5">
                      {secretKey}
                    </p>
                  </div>
                </div>
              )
            )}

            <form onSubmit={handleVerifySubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
                  Masukkan Kode Konfirmasi 6-Digit
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={code}
                  onChange={(e) =>
                    setCode(e.target.value.replace(/\D/g, ""))
                  }
                  placeholder="123456"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center tracking-[0.5em] text-2xl font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white py-3 rounded-lg font-medium transition shadow-md"
              >
                {loading ? "Memverifikasi..." : "Verifikasi & Aktifkan"}
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}