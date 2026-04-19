import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        fontFamily: "system-ui, -apple-system, sans-serif",
        textAlign: "center",
        gap: "1rem",
      }}
    >
      <h1 style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", margin: 0 }}>
        Luxe CRM
      </h1>
      <p style={{ color: "#555", margin: 0 }}>
        Signed in as <strong>{user?.email}</strong>
      </p>
      <form action="/logout" method="post">
        <button
          type="submit"
          style={{
            padding: "0.6rem 1rem",
            fontSize: "0.95rem",
            background: "#111",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          Log out
        </button>
      </form>
    </main>
  );
}
