import Hero from "@/components/hero";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <>
      <Hero />
      <main className="flex-1 flex flex-col items-center gap-8 px-4 sm:px-8 max-w-5xl mx-auto">
        <div className="text-center">
          <h2 className="text-2xl font-medium">Join Our Climate Change Initiative</h2>
          <p className="text-muted-foreground text-lg mt-4 mb-8">
            Sign in to access exclusive insights and contribute to our data-driven approach to climate change awareness.
          </p>
          <div className="flex gap-4 justify-center">
            {user ? (
              <Link
                href="/protected"
                className="bg-foreground py-3 px-6 rounded-lg text-background hover:bg-foreground/90 transition"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="bg-foreground py-3 px-6 rounded-lg text-background hover:bg-foreground/90 transition"
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  className="border border-foreground py-3 px-6 rounded-lg hover:bg-foreground/10 transition"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
