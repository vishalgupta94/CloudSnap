'use client';

export default function Home() {
  const loginToCognito = () => {
    console.log('process.env', process.env);
    const url = new URL(`${process.env.NEXT_PUBLIC_COGNITO_BASE_URL}/oauth2/authorize`);
    url.search = new URLSearchParams({
      client_id: process.env.NEXT_PUBLIC_CLIENT_ID!,
      response_type: process.env.NEXT_PUBLIC_RESPONSE_TYPE!,
      scope: process.env.NEXT_PUBLIC_SCOPES!,
      redirect_uri: process.env.NEXT_PUBLIC_REDIRECT_URI!,
    }).toString();

    window.location.href = url.toString();
  };

  return (
    <div>
      Login using Cognito
      <button type="button" onClick={loginToCognito}>
        Login Cognito
      </button>
    </div>
  );
}
