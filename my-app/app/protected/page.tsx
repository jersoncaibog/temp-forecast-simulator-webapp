import SimulationWrapper from "@/components/simulation-wrapper";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function ProtectedPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  return (
    <div className="flex-1 w-full flex flex-col gap-8 px-4">
      <h1 className="text-2xl font-medium text-center">Temperature Trend Analysis</h1>
      <SimulationWrapper />
    </div>
  );
}
