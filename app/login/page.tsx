import type { Metadata } from "next";
import LoginForm from "@/components/auth/LoginForm";

export const metadata: Metadata = { title: "Masuk" };

export default function LoginPage({
  searchParams,
}: {
  searchParams: { from?: string; expired?: string };
}) {
  const from = searchParams.from ?? "/dashboard";
  const showDemo = process.env.API_MODE !== "live";
  return (
    <main className="auth-wrap">
      <div className="card auth-card">
        <div className="card-body p-4 p-md-5">
          <div className="brand-big">MG</div>
          <h1 className="h4 text-center mb-1">MaternalGuard</h1>
          <p className="text-center text-muted-mg mb-4">
            Masuk untuk memantau ibu hamil binaan Anda.
          </p>
          {searchParams.expired ? (
            <div className="alert mg-alert pink small" role="status">
              Sesi Anda berakhir. Silakan masuk kembali.
            </div>
          ) : null}
          <LoginForm from={from} showDemo={showDemo} />
        </div>
      </div>
    </main>
  );
}
