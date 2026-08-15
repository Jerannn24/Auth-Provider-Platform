import { getSession } from "@/repositories/local.session.repository";
import { redirect } from "next/navigation";
import ActivityLogItems from "./_component/activity-log";
import LoginButton from "./_component/login-button";

export default async function Page() {
    const session = await getSession();
    if (session) {
        redirect("/dashboard");
    }else{
        redirect("/login");
    }
}
