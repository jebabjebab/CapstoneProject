import "bootstrap/dist/css/bootstrap.css";
import { Inter } from "next/font/google";
import "./styles/global.css";
import "./styles/page-modules.css";
import Layout from "./BgChanger/page";

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',  
  preload: true     
})

export const metadata = {
  title: "DermaServTech",
  description: "...",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/Materials/DermaServTech%20Logo/logo2.png" />
      </head>
      <body className={inter.className}>
        <Layout>{children}</Layout>
        <script
          src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/js/bootstrap.bundle.min.js"
          integrity="sha384-MrcW6ZMFYlzcLA8Nl+NtUVF0sA7MsXsP1UyJoMp4YLEuNSfAP+JcXn/tWtIaxVXM"
          crossOrigin="anonymous"
        ></script>
      </body>
    </html>
  );
}
