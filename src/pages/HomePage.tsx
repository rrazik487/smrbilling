// src/pages/HomePage.tsx
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

export default function HomePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  if (loading) return <div>Loading...</div>;
  if (!user) return null;

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Welcome {user.email}!</h1>
      {/* Your bills dashboard here */}
    </main>
  );
}
