import "@livekit/components-styles";
import { Public_Sans } from "next/font/google";
import { ToastContainer } from "react-toastify";
import "./globals.css";

const publicSans400 = Public_Sans({
  weight: "400",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full ${publicSans400.className}`}>
      <body className="h-full"> <ToastContainer position="top-right" autoClose={3000} />{children}</body>
    </html>
  );
}

