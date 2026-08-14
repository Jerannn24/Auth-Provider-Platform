import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function Page() {
    const cookieStore = await cookies();

    const sessionToken =
        cookieStore.get("session_token")?.value;

    if (sessionToken) {
        redirect("/dashboard");
    }

    return (
        <form action="/login">
            <button type="submit">
                Login
            </button>
        </form>
    );
}