import {Link} from "react-router-dom";
import {useContext, useEffect} from "react";
import {UserContext} from "./UserContext";

export default function Header() {
  const {setUserInfo,userInfo} = useContext(UserContext);
  useEffect(() => {
    fetch(`${import.meta.env.VITE_APP_API_URL}/profile`, {
      credentials: 'include',
    }).then(response => {
      if (response.status !== 401) {
      response.json().then(userInfo => {
        setUserInfo(userInfo);
      });
    }
    });
  }, []);

  function logout() {
    fetch(`${import.meta.env.VITE_APP_API_URL}/logout`, {
      credentials: 'include',
      method: 'POST',
    })
    .then(() => {
      setUserInfo(null);
      window.location.replace("/");
    })
    .catch((err) => {
      console.log(err);
    });
  }

  const username = userInfo?.username;

  return (
    <header>
      <Link to="/" className="logo">Dawit Develops</Link>
      <nav>
        {username && (
          <>
            <Link to="/create">Create new post</Link>
            <a onClick={logout}>Logout ({username})</a>
          </>
        )}
        {!username && (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </nav>
    </header>
  );
}