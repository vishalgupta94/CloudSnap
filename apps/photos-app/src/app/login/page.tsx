'use client'
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import axios from 'axios'
import qs from 'qs'

export default function Page() {
    const searchParams = useSearchParams()
    const code = searchParams.get('code');
    console.log("code",code);

    useEffect(()=>{

    const retrieveToken = async (code:string) => {

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
          'client_id': '276hi3oehtmfjamteb35q3clru', 
          'Content-Type': 'application/x-www-form-urlencoded', 
          'Cookie': 'XSRF-TOKEN=93a251d6-f6e0-4caa-b7be-2ba9a0c95914'
        },
        data : data
      };
  
      await axios.request(config)
    }  

    retrieveToken(code)
    .then((data)=>{
      console.log("data",data)
    })
    .catch((e)=> {
       console.log("error",e)
    })



    },[code])

    return (
      <div> 
        Login
      </div>
    );
  }
  