// app/page.js

"use client"; // Указывает, что это клиентский компонент

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (window.location.pathname !== "/main") {
      router.push("/main");
    }
  }, [router]);

  return (
    <main style={{backgroundColor: 'rgb(20, 20, 20)'}}>
    </main>
  );
}
