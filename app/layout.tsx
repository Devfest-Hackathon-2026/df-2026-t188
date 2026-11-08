import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Zen_Maru_Gothic } from "next/font/google";
import { APP_NAME } from "@/lib/appInfo";
import "./globals.css";

// やわらかい丸ゴシック。外部から読み込まず、next/font でアプリに組み込む
const zenMaruGothic = Zen_Maru_Gothic({
  variable: "--font-zen-maru-gothic",
  weight: ["500", "700", "900"],
  subsets: ["latin"],
  display: "swap",
});

// 数字と英字に使う。これも next/font でアプリに組み込む（画面を開いたときに外部へは取りに行かない）
const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  weight: ["700", "800"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: APP_NAME,
};

// スマホの下の端（ホームバー）の余白を使えるようにする。下に固定するボタンで使う
export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: "#f0f9ff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ja"
      className={`${zenMaruGothic.variable} ${plusJakartaSans.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
