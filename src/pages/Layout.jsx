import { Inter } from "next/font/google";
import "./index.css";

const inter = Inter({ subsets: ["latin"] });

// export const metadata = {
//   title: "SafeZone - Making Addis Ababa Safer Together",
//   description:
//     "Join thousands of residents in creating a safer community through real-time incident reporting, AI verification, and coordinated emergency response.",
// };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
