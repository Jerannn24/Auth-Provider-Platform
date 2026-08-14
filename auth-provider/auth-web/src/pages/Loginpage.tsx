import { useState } from "react";


export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const params = new URLSearchParams(window.location.search);

    const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
        setError("Email dan password harus diisi.");
        return;
    }

    setLoading(true);
    setError("");

    try {
        console.log("params:", params.toString());
        const response = await fetch(
            "http://localhost:8080/login",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email,
                    password,
                }),
                credentials: "include",
            }
        );

        const data = await response.json();

        if (!response.ok) {
            setError(data.error || "Login gagal.");
            return;
        }
        
        console.log("status:", response.status);
        console.log("ok:", response.ok);

        window.location.href =
            `http://localhost:8080/authorize?${params.toString()}`;

        } catch (err: any) {
            console.error(err);
            setError(err.message || "Terjadi kesalahan saat login.");
        } finally {
            setLoading(false);
        }
    };

    if (!params.has("client_id") || !params.has("redirect_uri")) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl p-8">
                    <h1 className="text-2xl font-bold text-gray-900">
                        Invalid Request
                    </h1>
                    <p className="mt-2 text-gray-500">
                        Missing required parameters.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen from-blue-600 via-indigo-600 to-purple-700 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-2xl p-8">
                    {/* Logo */}
                    <div className="text-center mb-8">

                        <h1 className="mt-4 text-3xl font-bold text-gray-900">
                            Auth Provider
                        </h1>

                        <p className="mt-2 text-gray-500">
                            Login untuk melanjutkan
                        </p>
                    </div>

                    <form
                        onSubmit={handleSubmit}
                        className="space-y-5"
                    >
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email
                            </label>

                            <input
                                type="email"
                                value={email}
                                onChange={(e) =>
                                    setEmail(e.target.value)
                                }
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
                                onChange={(e) =>
                                    setPassword(e.target.value)
                                }
                                placeholder="••••••••"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 rounded-lg font-medium transition"
                        >
                            {loading
                                ? "Memproses..."
                                : "Login"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}