import "./globals.css";
import { themeInitScript } from "./theme-init";
import ThemeToggle from "./components/ThemeToggle";

export const metadata = {
  title: "Classic Blackjack",
  description: "A browser-based classic blackjack card game."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
        />
      </head>
      <body className="app-shell">
        <ThemeToggle />
        <div className="app-shell__content">{children}</div>
        <footer className="app-shell__footer">
          <a
            className="app-shell__footer-link"
            href="https://cursor.com/agents"
            target="_blank"
            rel="noreferrer"
          >
            <img
              src="/cursor-built-with.png"
              alt=""
              width={18}
              height={18}
              className="app-shell__footer-logo"
            />
            Built with Cursor
          </a>
        </footer>
      </body>
    </html>
  );
}
