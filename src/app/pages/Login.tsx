import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { AlertCircle, Lock, Mail, Target, User } from "lucide-react";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { supabase } from "../lib/supabase";

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        navigate("/dashboard");
      }
    };

    void checkSession();
  }, [navigate]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setInfo("");

    if (!email || !password || (!isLogin && !nickname.trim())) {
      setError("Completa todos los campos.");
      return;
    }

    if (!isLogin && !email.includes("@")) {
      setError("Ingresa un correo válido.");
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setLoading(true);

    if (isLogin) {
      let loginEmail = email.trim().toLowerCase();

      if (!loginEmail.includes("@")) {
        const { data: resolvedEmail, error: resolveError } = await supabase.rpc("get_email_by_nickname", {
          nickname_input: loginEmail,
        });

        if (resolveError || !resolvedEmail) {
          setError("No encontramos ese nickname.");
          setLoading(false);
          return;
        }

        loginEmail = resolvedEmail;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({ email: loginEmail, password });
      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }
      navigate("/dashboard");
      return;
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: nickname.trim(), nickname: nickname.trim() } },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data.session) {
      navigate("/dashboard");
      return;
    }

    setInfo("Cuenta creada. Revisa tu correo para confirmar y luego inicia sesión.");
    setIsLogin(true);
    setLoading(false);
  };

  return (
    <div className="focus-shell focus-rings min-h-screen px-4 py-8">
      <div className="relative z-10 mx-auto max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-3">
          <div className="grid size-12 place-items-center rounded-none bg-[#f47c0f] text-white">
            <Target className="size-7" />
          </div>
          <span className="display-font text-5xl text-[#5b30d9]">Focus Zone</span>
        </Link>

        <Card className="focus-card rounded-none border-2 border-[#5b30d9]/35 p-8">
          <p className="focus-tag mb-5 w-fit">{isLogin ? "Acceso" : "Registro"}</p>
          <h1 className="display-font text-6xl text-[#f47c0f]">{isLogin ? "Entra" : "Crea cuenta"}</h1>
          <p className="mt-2 text-[#5b30d9]">
            {isLogin ? "Activa tu enfoque en segundos." : "Tu cuenta para estudiar con ritmo."}
          </p>

          {error && (
            <Alert variant="destructive" className="mt-5 rounded-none border-[#d4183d]">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {info && (
            <Alert className="mt-5 rounded-none border-[#5b30d9]/35">
              <AlertDescription>{info}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="nickname" className="font-bold text-[#5b30d9]">Nickname</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-[#7d4cd8]/70" />
                  <Input
                    id="nickname"
                    type="text"
                    placeholder="@tu_nickname"
                    value={nickname}
                    onChange={(event) => setNickname(event.target.value)}
                    className="h-11 rounded-none border-[#5b30d9]/25 pl-10"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="font-bold text-[#5b30d9]">{isLogin ? "Nickname o correo" : "Correo"}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-[#7d4cd8]/70" />
                <Input
                  id="email"
                  type={isLogin ? "text" : "email"}
                  placeholder={isLogin ? "@tu_nickname o tu@email.com" : "tu@email.com"}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="h-11 rounded-none border-[#5b30d9]/25 pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="font-bold text-[#5b30d9]">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-[#7d4cd8]/70" />
                <Input
                  id="password"
                  type="password"
                  placeholder="********"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-11 rounded-none border-[#5b30d9]/25 pl-10"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="h-12 w-full rounded-none bg-[#f47c0f] text-base font-bold text-white hover:bg-[#dd6900] focus-glow-orange"
            >
              {loading ? "Procesando..." : isLogin ? "Iniciar sesión" : "Crear cuenta"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError("");
                setInfo("");
              }}
              className="font-bold text-[#5b30d9] hover:underline"
            >
              {isLogin ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Inicia sesión"}
            </button>
          </div>

          <div className="mt-3 text-center">
            <Link to="/" className="text-sm text-[#5b30d9]/80 hover:underline">
              Volver al inicio
            </Link>
          </div>

          <div className="mt-6 rounded-none border border-[#5b30d9]/20 bg-[#ece8f9]/55 p-3 text-xs font-bold uppercase tracking-[0.1em] text-[#5b30d9]">
            Focus Zone: usa lo digital a tu favor.
          </div>
        </Card>
      </div>
    </div>
  );
}
