import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { AlertCircle, Eye, EyeOff, Lock, Mail, Target, User } from "lucide-react";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { supabase } from "../lib/supabase";

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [isRecoveringPassword, setIsRecoveringPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendingRecovery, setSendingRecovery] = useState(false);
  const [resendingVerification, setResendingVerification] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    const checkSession = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!cancelled && user) {
          navigate("/dashboard");
        }
      } catch (sessionError) {
        const message = sessionError instanceof Error ? sessionError.message : "";
        const isLockContention =
          message.includes("NavigatorLockAcquireTimeoutError") ||
          message.includes("lock") ||
          message.includes("was released because another request stole it");

        // In dev (StrictMode), duplicated auth checks can race for this lock.
        // We ignore lock-contention errors and let the next auth event/read settle.
        if (!isLockContention && !cancelled) {
          setError("No se pudo validar la sesión. Intenta de nuevo.");
        }
      }
    };

    void checkSession();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setError("");
        setInfo("Escribe tu nueva contraseña para terminar la recuperación.");
        setIsRecoveringPassword(true);
        setIsLogin(true);
      }
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  const getAuthRedirectTo = () => {
    if (typeof window === "undefined") {
      return undefined;
    }
    return `${window.location.origin}/login`;
  };

  const handleSendRecoveryEmail = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    setError("");
    setInfo("");

    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      setError("Para recuperar contraseña, ingresa tu correo (no nickname).");
      return;
    }

    setSendingRecovery(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: getAuthRedirectTo(),
    });
    setSendingRecovery(false);

    if (resetError) {
      setError("No se pudo enviar el correo de recuperación.");
      return;
    }

    setInfo("Te enviamos un correo para restablecer tu contraseña.");
  };

  const handleResendVerification = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    setError("");
    setInfo("");

    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      setError("Ingresa tu correo para reenviar la verificación.");
      return;
    }

    setResendingVerification(true);
    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email: normalizedEmail,
      options: {
        emailRedirectTo: getAuthRedirectTo(),
      },
    });
    setResendingVerification(false);

    if (resendError) {
      setError("No se pudo reenviar el correo de verificación.");
      return;
    }

    setInfo("Correo de verificación reenviado.");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setInfo("");

    if (isRecoveringPassword) {
      if (newPassword.length < 6) {
        setError("La nueva contraseña debe tener al menos 6 caracteres.");
        return;
      }
      if (newPassword !== confirmNewPassword) {
        setError("Las contraseñas no coinciden.");
        return;
      }

      setLoading(true);
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      setLoading(false);

      if (updateError) {
        setError("No se pudo actualizar la contraseña. Abre de nuevo el enlace del correo.");
        return;
      }

      await supabase.auth.signOut();
      setNewPassword("");
      setConfirmNewPassword("");
      setIsRecoveringPassword(false);
      setIsLogin(true);
      setInfo("Contraseña actualizada. Ahora inicia sesión.");
      return;
    }

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
        if (signInError.message.toLowerCase().includes("email not confirmed")) {
          setError("Tu correo no está verificado. Revisa tu bandeja o reenvía la verificación.");
        } else {
          setError(signInError.message);
        }
        setLoading(false);
        return;
      }
      navigate("/dashboard");
      return;
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: nickname.trim(), nickname: nickname.trim() },
        emailRedirectTo: getAuthRedirectTo(),
      },
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

    setInfo("Cuenta creada. Te enviamos un correo de verificación antes de iniciar sesión.");
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
          <p className="focus-tag mb-5 w-fit">{isRecoveringPassword ? "Recuperación" : isLogin ? "Acceso" : "Registro"}</p>
          <h1 className="display-font text-6xl text-[#f47c0f]">{isRecoveringPassword ? "Nueva clave" : isLogin ? "Entra" : "Crea cuenta"}</h1>
          <p className="mt-2 text-[#5b30d9]">
            {isRecoveringPassword
              ? "Actualiza tu contraseña para volver a entrar."
              : isLogin
                ? "Activa tu enfoque en segundos."
                : "Tu cuenta para estudiar con ritmo."}
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
            {!isRecoveringPassword && !isLogin && (
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

            {!isRecoveringPassword && (
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
            )}

            <div className="space-y-2">
              <Label htmlFor="password" className="font-bold text-[#5b30d9]">{isRecoveringPassword ? "Nueva contraseña" : "Contraseña"}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-[#7d4cd8]/70" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="********"
                  value={isRecoveringPassword ? newPassword : password}
                  onChange={(event) => {
                    if (isRecoveringPassword) {
                      setNewPassword(event.target.value);
                      return;
                    }
                    setPassword(event.target.value);
                  }}
                  className="h-11 rounded-none border-[#5b30d9]/25 pl-10 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-2.5 text-[#7d4cd8] hover:text-[#5b30d9]"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {isRecoveringPassword && (
              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="font-bold text-[#5b30d9]">Confirmar contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-[#7d4cd8]/70" />
                  <Input
                    id="confirm-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="********"
                    value={confirmNewPassword}
                    onChange={(event) => setConfirmNewPassword(event.target.value)}
                    className="h-11 rounded-none border-[#5b30d9]/25 pl-10"
                  />
                </div>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="h-12 w-full rounded-none bg-[#f47c0f] text-base font-bold text-white hover:bg-[#dd6900] focus-glow-orange"
            >
              {loading ? "Procesando..." : isRecoveringPassword ? "Guardar nueva contraseña" : isLogin ? "Iniciar sesión" : "Crear cuenta"}
            </Button>
          </form>

          {isLogin && !isRecoveringPassword && (
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Button
                type="button"
                variant="outline"
                disabled={sendingRecovery}
                onClick={() => void handleSendRecoveryEmail()}
                className="h-10 rounded-none border-[#5b30d9]/35 text-[#5b30d9] hover:bg-[#5b30d9]/10"
              >
                {sendingRecovery ? "Enviando..." : "Olvidé mi contraseña"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={resendingVerification}
                onClick={() => void handleResendVerification()}
                className="h-10 rounded-none border-[#5b30d9]/35 text-[#5b30d9] hover:bg-[#5b30d9]/10"
              >
                {resendingVerification ? "Reenviando..." : "Reenviar verificación"}
              </Button>
            </div>
          )}

          <div className="mt-6 text-center">
            {isRecoveringPassword ? (
              <button
                onClick={() => {
                  setIsRecoveringPassword(false);
                  setNewPassword("");
                  setConfirmNewPassword("");
                  setError("");
                  setInfo("");
                }}
                className="font-bold text-[#5b30d9] hover:underline"
              >
                Volver a iniciar sesión
              </button>
            ) : (
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
            )}
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
