'use client'
import { useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import axios from 'axios'
import qs from 'qs'
import { useRouter } from "next/navigation";

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams()
    const code = searchParams.get('code');
    console.log("code",code);

    useEffect(()=>{

    const retrieveToken = async (code: string) => {
      try {
        const data = qs.stringify({
          'grant_type': 'authorization_code',
          'code': code,
          'redirect_uri': 'http://localhost:3000/login',
          'client_id': '276hi3oehtmfjamteb35q3clru' 
        });
    
        const config = {
          method: 'post',
          maxBodyLength: Infinity,
          url: 'https://photos-snap-domain.auth.ap-south-1.amazoncognito.com/oauth2/token',
          headers: { 
            'Authorization': 'Basic Mjc2aGkzb2VodG1mamFtdGViMzVxM2NscnU6MTJsc3NkbGZzdHUwNmI4cmg1a3RzNm9xMGxzNGNwNDF2cHFkN2FzODRuMGE2NG04bjAyMw==', 
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          data: data
        };
    
        const response = await axios.request(config);
        
        const idToken = response.data.id_token;
        const accessToken = response.data.access_token;
        const refreshToken = response.data.refresh_token;
        
        console.log("idToken:", idToken);
        console.log("accessToken:", accessToken);
        console.log("refreshToken:", refreshToken);

        localStorage.setItem('idToken',idToken)
        localStorage.setItem('accessToken',accessToken)
        localStorage.setItem('refreshToken',refreshToken);

        router.push("/home");
      } catch (error) {
        console.log("Token exchange error:", error);
        router.push("/error")
      }
    }  

    // Only call retrieveToken if code exists
    if (code) {
      retrieveToken(code)
        .then(() => {
          console.log("Successfully retrieved token:");
        })
        .catch((e) => {
          console.log("Failed to retrieve token:", e.response?.data || e.message);
        });
    } else {
      console.log("No authorization code found in URL");
    }

    }, [code, router])

    return (
      <div> 
        Login
      </div>
    );
}

export default function Page() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <LoginContent />
        </Suspense>
    );
}
  