'use client'
import { useSearchParams } from "next/navigation";


export default function Page() {
    const searchParams = useSearchParams()
    const code = searchParams.get('code');
    console.log("code",code);

    return (
      <div> 
        Login
      </div>
    );
  }
  