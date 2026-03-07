import "./globals.css";

export const metadata = {
  title: "Cursor X Workbench",
  description: "A super vanilla Next.js app."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
