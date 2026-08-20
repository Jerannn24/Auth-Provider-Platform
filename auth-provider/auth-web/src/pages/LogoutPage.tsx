import { useState } from "react";

export default function LogoutPage() {
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    const params = new URLSearchParams(window.location.search);

    const handleLogout = async (e: React.FormEvent) => {
        e.preventDefault();

        setLoading(true);
        setError("");
        setSuccess("");
        try {
            const response = await fetch("http://localhost:8080/logout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                setError(data.error || "Logout gagal.");
                return;
            }
            
            setSuccess("Logout berhasil.");
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Terjadi kesalahan saat logout.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen from-blue-600 via-indigo-600 to-purple-700 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
                    {/* Header Icon */}
                    <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg
                            className="w-8 h-8"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                            />
                        </svg>
                    </div>

                    <h1 className="text-3xl font-bold text-gray-900">
                        Auth Provider
                    </h1>
                    <p className="mt-2 text-gray-500 mb-8">
                        Apakah Anda yakin ingin keluar dari sesi SSO ini?
                    </p>

                    {error && (
                        <div className="mb-6 bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg text-left">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="mb-6 bg-green-50 border border-green-200 text-green-600 text-sm p-3 rounded-lg text-left">
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleLogout} className="space-y-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white py-3 rounded-lg font-medium transition shadow-md"
                        >
                            {loading ? "Memproses Logout..." : "Ya, Logout"}
                        </button>

                    </form>
                </div>
            </div>
        </div>
    );
}