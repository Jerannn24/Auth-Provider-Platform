import { redirect } from "next/navigation";
import { getSession } from "@/repositories/local.session.repository";
import { getLocalUser } from "@/repositories/local.user.repository";
import LogoutButton from "../_component/logout-button";
import { cookies } from "next/dist/server/request/cookies";

const Page = async () => {
  const session = await getSession();
  const cookiesStore = await cookies();
  const correlation_id = cookiesStore.get("correlation")?.value;
  if (!session) {
    redirect("/");
  }

  const userInfo = await getLocalUser(session.external_user_id);
  
  return (
    <div>
      <h1 className="flex items-center justify-center text-2xl font-bold mb-4 pb-4 border-b-2 border-gray-300">
        WELCOME {userInfo?.name || 'John Doe'} TO DASHBOARD APP-B
      </h1>

      <div className="flex flex-col items-center justify-center text-2xl font-bold mb-4 pb-4 border-b-2 border-gray-300">
        <h2 className="flex flex-1">User Information</h2>
        {userInfo && (
          <div>
            <p>Name   : {userInfo.name}</p>
            <p>Email  : {userInfo.email}</p>
            <p>Groups : {userInfo.groups.join(", ")}</p>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center justify-center text-2xl font-bold mb-4 pb-4 border-b-2 border-gray-300">
        <h2 className="flex flex-1">Session Information</h2>
        {session && (
          <div>
            <p>Session Status: {session.status}</p>
            <p>Session Created At: {session.created_at.toISOString()}</p>
            <p>Session Expires At: {session.expires_at.toISOString()}</p>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center justify-center text-2xl font-bold mb-4 pb-4 border-b-2 border-gray-300">
        <LogoutButton />
      </div>

      
    </div>
  )
}

export default Page
