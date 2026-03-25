import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "vietnamese"],
});

export const metadata: Metadata = {
  title: {
    default: "PC Parts E-Commerce | Linh kiện máy tính chính hãng",
    template: "%s | PC Parts",
  },
  description:
    "Mua linh kiện máy tính chính hãng giá tốt nhất tại Việt Nam. CPU, GPU, RAM, SSD, Mainboard từ Intel, AMD, NVIDIA. Build PC thông minh với AI kiểm tra tương thích.",
  keywords: [
    "linh kiện máy tính",
    "build pc",
    "CPU",
    "GPU",
    "RAM",
    "SSD",
    "mainboard",
    "pc parts",
    "mua linh kiện",
    "máy tính",
  ],
  authors: [{ name: "PC Parts E-Commerce" }],
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: "https://pcparts.vn",
    siteName: "PC Parts E-Commerce",
    title: "PC Parts E-Commerce | Linh kiện máy tính chính hãng",
    description:
      "Mua linh kiện máy tính chính hãng giá tốt nhất. Build PC thông minh với AI.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${inter.variable} h-full antialiased dark`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-slate-950 text-white font-[family-name:var(--font-inter)]">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "rgb(15, 23, 42)",
              border: "1px solid rgb(51, 65, 85)",
              color: "white",
            },
          }}
        />
      </body>
    </html>
  );
}
