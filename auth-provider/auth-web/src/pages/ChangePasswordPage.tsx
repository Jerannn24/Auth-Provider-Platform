import { useState } from "react";

export default function ChangePasswordPage() {
    const [email, setEmail] = useState("");
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !oldPassword || !newPassword) {
            setError("Email, password lama, dan password baru harus diisi.");
            return;
        }

        if (newPassword.length < 6) {
            setError("Password baru minimal 6 karakter.");
            return;
        }

        setLoading(true);
        setError("");
        setSuccess("");

        try {
            const response = await fetch(
                "http://localhost:8080/change-password",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        email,
                        oldPassword,
                        newPassword,
                    }),
                    credentials: "include",
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || "Gagal mengubah password.");
                return;
            }

            setSuccess("Password berhasil diubah. Silakan gunakan password baru Anda.");
            setOldPassword("");
            setNewPassword("");
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Terjadi kesalahan saat mengubah password.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen from-blue-600 via-indigo-600 to-purple-700 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-2xl p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">
                            Auth Provider
                        </h1>
                        <p className="mt-2 text-gray-500">
                            Ubah Password Akun
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
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
                                Password Lama
                            </label>
                            <input
                                type="password"
                                value={oldPassword}
                                onChange={(e) => setOldPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Password Baru
                            </label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="bg-green-50 border border-green-200 text-green-600 text-sm p-3 rounded-lg">
                                {success}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 rounded-lg font-medium transition"
                        >
                            {loading ? "Memproses..." : "Ubah Password"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}