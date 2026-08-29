import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StudyOne — Study smarter, every day",
  description: "A simple study planner for students.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
