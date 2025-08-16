

export default function Home() {

  const loginToCognito = () =>  {

  }

  return (
    <div> Login using cognito
      <button onClick={loginToCognito}></button>

    </div>
  );
}

/*
import axios from "axios";

const baseUrl = "https://photos-snap-domain.auth.ap-south-1.amazoncognito.com/login";

const qs = new URLSearchParams({
  client_id: "276hi3oehtmfjamteb35q3clru",
  response_type: "code",
  scope: "aws.cognito.signin.user.admin email openid phone profile",
  redirect_uri: "http://localhost:3000/login",
}).toString();

const url = `${baseUrl}?${qs}`;

const res = await axios.get(url, {
  // maxRedirects: 0, // optional
});
console.log(url);       // full URL with encoded query string
console.log(res.status);


*/