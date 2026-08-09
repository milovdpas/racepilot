import { AppRuntime } from "@/components/layout/app-runtime";

/**
 * The first-run flow sits outside `/app`, but it is the app: it is translated,
 * it writes preferences, and it is where `preferences.country` gets detected.
 * So it needs the same runtime, and this layout is the only reason it gets it.
 */
export default function WelcomeLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <AppRuntime>{children}</AppRuntime>;
}
