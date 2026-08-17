import { getSession } from "@/repositories/local.session.repository";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import ActivityLogItems from "../_component/activity-log";
import LoginButton from "../_component/login-button";

export default async function Page() {
    const session = await getSession();

    if (session) {
        redirect("/dashboard");
    }


    return (
        <div>
            <div className="flex flex-col items-center justify-center text-2xl font-bold mb-4 pb-4 border-b-2 border-gray-300">
                <LoginButton />
            </div>
        </div>
    );
}
