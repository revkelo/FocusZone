import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { AlertCircle, Eye, EyeOff, Lock, Mail, ShieldCheck, User } from "lucide-react";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { supabase } from "../lib/supabase";

type AuthView = "login" | "register" | "registerCode" | "recoverRequest" | "recoverCode" | "verifyLoginCode";

type ApiResult = {
  ok: boolean;
  error: string;
};

const normalizeInput = (value: string) => value.trim();
const hasWhitespace = (value: string) => /\s/.test(value);

export default function Login() {
  const navigate = useNavigate();

  const [view, setView] = useState<AuthView>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const checkSession = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!cancelled && user) {
        navigate("/dashboard");
      }
    };

    void checkSession();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const postAuth = async (url: string, payload: Record<string, unknown>) => {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const body = (await response.json().catch(() => ({}))) as ApiResult;
    if (!response.ok || body.error) {
      throw new Error(body.error || "No se pudo procesar la solicitud.");
    }
  };

  const resetMessages = () => {
    setError("");
    setInfo("");
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    resetMessages();

    if (!email || !password) {
      setError("Completa correo/nickname y contraseña.");
      return;
    }

    setLoading(true);
    let loginEmail = normalizeInput(email).toLowerCase();

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

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password,
    });

    if (signInError) {
      const lowerMessage = signInError.message.toLowerCase();
      if (lowerMessage.includes("email not confirmed") || lowerMessage.includes("email not verified")) {
        try {
          await postAuth("/api/request-existing-verification-code", { email: loginEmail });
          setView("verifyLoginCode");
          setEmail(loginEmail);
          setInfo("Tu correo no está verificado. Te enviamos un código de 4 dígitos.");
          setLoading(false);
          return;
        } catch (requestError) {
          setError(requestError instanceof Error ? requestError.message : "No se pudo enviar código de verificación.");
          setLoading(false);
          return;
        }
      }

      setError("Credenciales inválidas.");
      setLoading(false);
      return;
    }

    setLoading(false);
    navigate("/dashboard");
  };

  const handleRequestSignupCode = async (event: React.FormEvent) => {
    event.preventDefault();
    resetMessages();

    const normalizedEmail = normalizeInput(email).toLowerCase();
    const normalizedNickname = normalizeInput(nickname);

    if (!normalizedEmail.includes("@")) {
      setError("Ingresa un correo válido.");
      return;
    }
    if (normalizedNickname.length < 3) {
      setError("El nickname debe tener mínimo 3 caracteres.");
      return;
    }
    if (hasWhitespace(normalizedNickname)) {
      setError("El nickname no puede tener espacios.");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      await postAuth("/api/request-signup-code", {
        email: normalizedEmail,
        nickname: normalizedNickname,
      });
      setInfo("Te enviamos un código de 4 dígitos a tu correo.");
      setView("registerCode");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No se pudo enviar el código.");
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteSignup = async (event: React.FormEvent) => {
    event.preventDefault();
    resetMessages();

    const normalizedCode = normalizeInput(code);
    if (!/^\d{4}$/.test(normalizedCode)) {
      setError("Ingresa un código de 4 dígitos.");
      return;
    }

    setLoading(true);
    try {
      await postAuth("/api/complete-signup-with-code", {
        email: normalizeInput(email).toLowerCase(),
        nickname: normalizeInput(nickname),
        password,
        code: normalizedCode,
      });
      setView("login");
      setCode("");
      setConfirmPassword("");
      setInfo("Cuenta verificada y creada. Ya puedes iniciar sesión.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No se pudo verificar el código.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendRecoveryCode = async (event: React.FormEvent) => {
    event.preventDefault();
    resetMessages();

    const normalizedEmail = normalizeInput(email).toLowerCase();
    if (!normalizedEmail.includes("@")) {
      setError("Ingresa tu correo para recuperar contraseña.");
      return;
    }

    setLoading(true);
    try {
      await postAuth("/api/request-password-reset-code", { email: normalizedEmail });
      setView("recoverCode");
      setInfo("Código enviado. Revisa tu correo para continuar.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No se pudo enviar el código.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordWithCode = async (event: React.FormEvent) => {
    event.preventDefault();
    resetMessages();

    const normalizedCode = normalizeInput(code);
    if (!/^\d{4}$/.test(normalizedCode)) {
      setError("Ingresa un código de 4 dígitos.");
      return;
    }
    if (newPassword.length < 6) {
      setError("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      await postAuth("/api/reset-password-with-code", {
        email: normalizeInput(email).toLowerCase(),
        code: normalizedCode,
        newPassword,
      });
      setView("login");
      setCode("");
      setNewPassword("");
      setConfirmNewPassword("");
      setInfo("Contraseña actualizada. Inicia sesión con la nueva clave.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No se pudo actualizar la contraseña.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyLoginEmailCode = async (event: React.FormEvent) => {
    event.preventDefault();
    resetMessages();

    const normalizedCode = normalizeInput(code);
    if (!/^\d{4}$/.test(normalizedCode)) {
      setError("Ingresa un código de 4 dígitos.");
      return;
    }

    setLoading(true);
    try {
      await postAuth("/api/verify-existing-email-code", {
        email: normalizeInput(email).toLowerCase(),
        code: normalizedCode,
      });
      setView("login");
      setCode("");
      setInfo("Correo verificado. Ahora inicia sesión.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No se pudo verificar el correo.");
    } finally {
      setLoading(false);
    }
  };

  const title =
    view === "register"
      ? "Crea cuenta"
      : view === "registerCode"
        ? "Verifica correo"
        : view === "recoverRequest"
          ? "Recuperar"
          : view === "recoverCode"
            ? "Nuevo acceso"
            : view === "verifyLoginCode"
              ? "Verifica correo"
              : "Entra";

  const tag =
    view === "register" || view === "registerCode"
      ? "Registro"
      : view === "recoverRequest" || view === "recoverCode"
        ? "Recuperación"
        : view === "verifyLoginCode"
          ? "Verificación"
          : "Acceso";

  return (
    <div className="focus-shell focus-grain focus-rings focus-no-stars focus-soft-round min-h-screen overflow-x-hidden px-4 py-8">
      <div className="focus-figure-layer" aria-hidden>
        <div className="focus-figure-arc-left" />
        <div className="focus-figure-arc-right" />
        <div className="focus-figure-dot focus-figure-dot-a" />
      </div>
      <div className="relative z-10 mx-auto max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center">
          <img
            src="/assets/focuszone/logo.png"
            alt="Focus Zone"
            className="h-[4.4rem] w-auto object-contain sm:h-[5rem]"
          />
        </Link>

        <Card className="focus-card rounded-none border-2 border-[#5b30d9]/35 p-8">
          <p className="focus-tag mb-5 w-fit">{tag}</p>
          <h1 className="display-font text-6xl text-[#f47c0f]">{title}</h1>
          <p className="mt-2 text-[#5b30d9]">
            {view === "register"
              ? "Paso 1 de 2: completa tus datos."
              : view === "registerCode"
                ? "Paso 2 de 2: ingresa el código de 4 dígitos."
                : view === "recoverRequest"
                  ? "Te enviaremos un código de recuperación."
                  : view === "recoverCode"
                    ? "Ingresa código y define tu nueva contraseña."
                    : view === "verifyLoginCode"
                      ? "Ingresa el código para verificar tu correo."
                      : "Activa tu enfoque en segundos."}
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

          {view === "login" && (
            <form onSubmit={handleLogin} className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="font-bold text-[#5b30d9]">Nickname o correo</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-[#7d4cd8]/70" />
                  <Input
                    id="email"
                    type="text"
                    placeholder="@tu_nickname o tu@email.com"
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
                    type={showPassword ? "text" : "password"}
                    placeholder="********"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
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

              <Button
                type="submit"
                disabled={loading}
                className="h-12 w-full rounded-none bg-[#f47c0f] text-base font-bold text-white hover:bg-[#dd6900] focus-glow-orange"
              >
                {loading ? "Procesando..." : "Iniciar sesión"}
              </Button>
            </form>
          )}

          {view === "register" && (
            <form onSubmit={handleRequestSignupCode} className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nickname" className="font-bold text-[#5b30d9]">Nickname</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-[#7d4cd8]/70" />
                  <Input
                    id="nickname"
                    type="text"
                    placeholder="@tu_nickname"
                    value={nickname}
                    onChange={(event) => setNickname(event.target.value.replace(/\s+/g, ""))}
                    className="h-11 rounded-none border-[#5b30d9]/25 pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-email" className="font-bold text-[#5b30d9]">Correo</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-[#7d4cd8]/70" />
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="h-11 rounded-none border-[#5b30d9]/25 pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-password" className="font-bold text-[#5b30d9]">Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-[#7d4cd8]/70" />
                  <Input
                    id="register-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="********"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
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

              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="font-bold text-[#5b30d9]">Repetir contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-[#7d4cd8]/70" />
                  <Input
                    id="confirm-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="********"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="h-11 rounded-none border-[#5b30d9]/25 pl-10"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="h-12 w-full rounded-none bg-[#f47c0f] text-base font-bold text-white hover:bg-[#dd6900] focus-glow-orange"
              >
                {loading ? "Enviando..." : "Enviar código de verificación"}
              </Button>
            </form>
          )}

          {view === "registerCode" && (
            <form onSubmit={handleCompleteSignup} className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-code" className="font-bold text-[#5b30d9]">Código de 4 dígitos</Label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3 top-3 h-4 w-4 text-[#7d4cd8]/70" />
                  <Input
                    id="signup-code"
                    type="text"
                    inputMode="numeric"
                    placeholder="1234"
                    value={code}
                    onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 4))}
                    className="h-11 rounded-none border-[#5b30d9]/25 pl-10 tracking-[0.3em]"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="h-12 w-full rounded-none bg-[#f47c0f] text-base font-bold text-white hover:bg-[#dd6900] focus-glow-orange"
              >
                {loading ? "Verificando..." : "Verificar y crear cuenta"}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => setView("register")}
                className="h-11 w-full rounded-none border-[#5b30d9]/35 text-[#5b30d9]"
              >
                Volver al paso 1
              </Button>
            </form>
          )}

          {view === "recoverRequest" && (
            <form onSubmit={handleSendRecoveryCode} className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="recover-email" className="font-bold text-[#5b30d9]">Correo</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-[#7d4cd8]/70" />
                  <Input
                    id="recover-email"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="h-11 rounded-none border-[#5b30d9]/25 pl-10"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="h-12 w-full rounded-none bg-[#f47c0f] text-base font-bold text-white hover:bg-[#dd6900] focus-glow-orange"
              >
                {loading ? "Enviando..." : "Enviar código"}
              </Button>
            </form>
          )}

          {view === "recoverCode" && (
            <form onSubmit={handleResetPasswordWithCode} className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="recover-code" className="font-bold text-[#5b30d9]">Código de 4 dígitos</Label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3 top-3 h-4 w-4 text-[#7d4cd8]/70" />
                  <Input
                    id="recover-code"
                    type="text"
                    inputMode="numeric"
                    placeholder="1234"
                    value={code}
                    onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 4))}
                    className="h-11 rounded-none border-[#5b30d9]/25 pl-10 tracking-[0.3em]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password" className="font-bold text-[#5b30d9]">Nueva contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-[#7d4cd8]/70" />
                  <Input
                    id="new-password"
                    type={showNewPassword ? "text" : "password"}
                    placeholder="********"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    className="h-11 rounded-none border-[#5b30d9]/25 pl-10 pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((value) => !value)}
                    className="absolute right-3 top-2.5 text-[#7d4cd8] hover:text-[#5b30d9]"
                    aria-label={showNewPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-new-password" className="font-bold text-[#5b30d9]">Repetir nueva contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-[#7d4cd8]/70" />
                  <Input
                    id="confirm-new-password"
                    type={showNewPassword ? "text" : "password"}
                    placeholder="********"
                    value={confirmNewPassword}
                    onChange={(event) => setConfirmNewPassword(event.target.value)}
                    className="h-11 rounded-none border-[#5b30d9]/25 pl-10"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="h-12 w-full rounded-none bg-[#f47c0f] text-base font-bold text-white hover:bg-[#dd6900] focus-glow-orange"
              >
                {loading ? "Actualizando..." : "Cambiar contraseña"}
              </Button>
            </form>
          )}

          {view === "verifyLoginCode" && (
            <form onSubmit={handleVerifyLoginEmailCode} className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="verify-login-code" className="font-bold text-[#5b30d9]">Código de 4 dígitos</Label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3 top-3 h-4 w-4 text-[#7d4cd8]/70" />
                  <Input
                    id="verify-login-code"
                    type="text"
                    inputMode="numeric"
                    placeholder="1234"
                    value={code}
                    onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 4))}
                    className="h-11 rounded-none border-[#5b30d9]/25 pl-10 tracking-[0.3em]"
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="h-12 w-full rounded-none bg-[#f47c0f] text-base font-bold text-white hover:bg-[#dd6900] focus-glow-orange"
              >
                {loading ? "Verificando..." : "Verificar correo"}
              </Button>
            </form>
          )}

          <div className="mt-6 space-y-2 text-center">
            {view !== "login" && (
              <button
                onClick={() => {
                  resetMessages();
                  setView("login");
                }}
                className="font-bold text-[#5b30d9] hover:underline"
              >
                Volver a iniciar sesión
              </button>
            )}

            {view === "login" && (
              <>
                <button
                  onClick={() => {
                    resetMessages();
                    setView("register");
                  }}
                  className="block w-full font-bold text-[#5b30d9] hover:underline"
                >
                  ¿No tienes cuenta? Regístrate
                </button>
                <button
                  onClick={() => {
                    resetMessages();
                    setView("recoverRequest");
                  }}
                  className="block w-full font-bold text-[#5b30d9] hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </>
            )}
          </div>

          <div className="mt-3 text-center">
            <Link to="/" className="text-sm text-[#5b30d9]/80 hover:underline">
              Volver al inicio
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}




