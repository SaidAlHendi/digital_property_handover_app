import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export function Registration() {
  const { signIn } = useAuthActions();
  const createUserProfile = useMutation(api.authHelpers.createUserProfile);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true);
    try {
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;
      const name = formData.get("name") as string;
      const confirmPassword = formData.get("confirmPassword") as string;

      if (!email || !password || !name) {
        toast.error("Bitte füllen Sie alle Felder aus");
        return;
      }

      if (password !== confirmPassword) {
        toast.error("Passwörter stimmen nicht überein");
        return;
      }

      if (password.length < 6) {
        toast.error("Passwort muss mindestens 6 Zeichen lang sein");
        return;
      }

      // Register with Convex Auth
      await signIn("password", { 
        email, 
        password, 
        name,
        flow: "signUp" 
      });

      // Create user profile with default "user" role
      await createUserProfile();
      toast.success("Registrierung erfolgreich! Sie sind jetzt angemeldet.");
    } catch (error: any) {
      console.error("Registration error:", error);
      if (error.message?.includes("already exists")) {
        toast.error("Ein Benutzer mit dieser E-Mail-Adresse existiert bereits");
      } else {
        toast.error("Registrierung fehlgeschlagen: " + (error.message || "Unbekannter Fehler"));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form action={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          className="auth-input-field"
          placeholder="Ihr vollständiger Name"
        />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          E-Mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="auth-input-field"
          placeholder="ihre@email.com"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          Passwort
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          className="auth-input-field"
          placeholder="Mindestens 6 Zeichen"
        />
      </div>
      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
          Passwort bestätigen
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          className="auth-input-field"
          placeholder="Passwort wiederholen"
        />
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="auth-button"
      >
        {isLoading ? "Registrierung läuft..." : "Registrieren"}
      </button>
    </form>
  );
}
