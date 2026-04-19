import type { ReactNode } from "react";

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: 360,
          background: "#fff",
          border: "1px solid #e5e5e5",
          borderRadius: 12,
          padding: "1.5rem",
          boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", margin: 0 }}>{title}</h1>
        {subtitle ? (
          <p style={{ color: "#555", marginTop: "0.5rem", marginBottom: "1rem" }}>
            {subtitle}
          </p>
        ) : (
          <div style={{ height: "1rem" }} />
        )}
        {children}
        {footer ? <div style={{ marginTop: "1rem" }}>{footer}</div> : null}
      </section>
    </main>
  );
}

export const formFieldStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: "0.6rem 0.75rem",
  fontSize: "1rem",
  border: "1px solid #ccc",
  borderRadius: 8,
  marginTop: "0.25rem",
};

export const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.875rem",
  color: "#333",
  marginTop: "0.75rem",
};

export const buttonStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.7rem",
  marginTop: "1rem",
  fontSize: "1rem",
  fontWeight: 600,
  color: "#fff",
  background: "#111",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
};

export const errorStyle: React.CSSProperties = {
  color: "#b00020",
  fontSize: "0.875rem",
  marginTop: "0.75rem",
};

export const linkStyle: React.CSSProperties = {
  color: "#0366d6",
  fontSize: "0.875rem",
  textDecoration: "none",
};
