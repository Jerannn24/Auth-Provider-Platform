import { getSession } from "@/repositories/local.session.repository";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import ActivityLogItems from "../_component/activity-log";
import LoginButton from "../_component/login-button";
import * as activityLogRepository from "../../repositories/local.log.repository";

export default async function Page() {
    const session = await getSession();
    const cookiesStore = await cookies();
    const correlation_id = cookiesStore.get("correlation")?.value;

    if (session) {
        redirect("/dashboard");
    }

    const activityLogs = await activityLogRepository.getActivityLogsByCorrelationId(correlation_id as string) || [];

    return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-6">
            <div className="flex flex-col items-center justify-center text-2xl font-bold mb-4 pb-4 border-b-2 border-gray-300">
                <LoginButton />
            </div>
            <div className="flex flex-col items-center justify-center text-2xl font-bold">   
                <ActivityLogItems logs={activityLogs} />
            </div>
        </div>
    );
}
