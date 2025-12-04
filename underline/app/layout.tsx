import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
    title: "Underline - 책으로 시작하는 인연",
    description: "좋아하는 책의 문장으로 소개팅을 시작하세요",
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    themeColor: "#FCFCFA",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ko">
            <body className="antialiased">
                {children}
                <Toaster position="top-center" />
                <script src="https://pay.nicepay.co.kr/v1/js/"></script>
            </body>
        </html>
    );
}
