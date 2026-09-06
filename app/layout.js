import "./globals.css";

export const metadata = {
  title: "AuthKeys",
  description: "Key authorization system",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
