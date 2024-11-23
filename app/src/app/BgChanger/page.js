"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const Layout = ({ children }) => {
  const pathname = usePathname();

  useEffect(() => {
    const setBackgroundImage = () => {
      let backgroundImage = "";
      switch (pathname) {
        case "/":
          backgroundImage = 'url("/Materials/Background.png")';
          break;
        case "/mainDash":
          backgroundImage = 'url("/Materials/Background2.png")';
          break;
        case "/chatbot":
          backgroundImage = 'url("/Materials/Background2.png")';
          break;
        default:
          backgroundImage = 'url("/Materials/Background.png")';
          break;
      }
      document.body.style.backgroundImage = backgroundImage;
      document.body.style.backgroundSize = "cover";
      document.body.style.backgroundRepeat = "no-repeat";
      document.body.style.backgroundPosition = "center center";
      document.body.style.backgroundAttachment = "fixed";
    };

    setBackgroundImage();

    return () => {
      document.body.style.backgroundImage = "";
    };
  }, [pathname]);

  return <>{children}</>;
};

export default Layout;
