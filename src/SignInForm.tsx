"use client";
import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { toast } from "sonner";

export function SignInForm() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="w-full">
      <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
        <div className="text-sm text-blue-800">
          <p className="font-medium mb-2">Anmeldeanweisungen:</p>
          <div className="space-y-1">
            <p><strong>Bestehende Benutzer:</strong> Verwenden Sie "Sign in" mit Ihrem bestehenden Passwort</p>
            <p><strong>Neue Benutzer (vom Admin erstellt):</strong> Verwenden Sie "Sign up" um Ihr Konto zu aktivieren und ein Passwort zu erstellen</p>
          </div>
        </div>
      </div>
      <form
        className="flex flex-col gap-form-field"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitting(true);
          const formData = new FormData(e.target as HTMLFormElement);
          formData.set("flow", flow);
          void signIn("password", formData).catch((error) => {
            let toastTitle = "";
            if (error.message.includes("Invalid password")) {
              toastTitle = "Falsches Passwort. Bitte versuchen Sie es erneut.";
            } else if (error.message.includes("User not found")) {
              toastTitle = flow === "signIn" 
                ? "Benutzer nicht gefunden. Wurden Sie von einem Admin erstellt? Dann verwenden Sie 'Sign up'."
                : "Diese E-Mail ist bereits registriert. Verwenden Sie 'Sign in'.";
            } else {
              toastTitle = flow === "signIn"
                ? "Anmeldung fehlgeschlagen. Wurden Sie von einem Admin erstellt? Dann verwenden Sie 'Sign up'."
                : "Registrierung fehlgeschlagen. Existiert bereits ein Konto? Dann verwenden Sie 'Sign in'.";
            }
            toast.error(toastTitle);
            setSubmitting(false);
          });
        }}
      >
        <input
          className="auth-input-field"
          type="email"
          name="email"
          placeholder="Email"
          required
        />
        <input
          className="auth-input-field"
          type="password"
          name="password"
          placeholder={flow === "signIn" ? "Passwort" : "Neues Passwort erstellen"}
          required
        />
        <button className="auth-button" type="submit" disabled={submitting}>
          {submitting ? "Wird verarbeitet..." : (flow === "signIn" ? "Anmelden" : "Registrieren")}
        </button>
        <div className="text-center text-sm text-secondary">
          <span>
            {flow === "signIn"
              ? "Noch kein Konto oder vom Admin erstellt? "
              : "Bereits ein Konto? "}
          </span>
          <button
            type="button"
            className="text-primary hover:text-primary-hover hover:underline font-medium cursor-pointer"
            onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
          >
            {flow === "signIn" ? "Hier registrieren" : "Hier anmelden"}
          </button>
        </div>
      </form>
      <div className="flex items-center justify-center my-3">
        <hr className="my-4 grow border-gray-200" />
        <span className="mx-4 text-secondary">oder</span>
        <hr className="my-4 grow border-gray-200" />
      </div>
      <button className="auth-button" onClick={() => void signIn("anonymous")}>
        Anonym anmelden
      </button>
    </div>
  );
}