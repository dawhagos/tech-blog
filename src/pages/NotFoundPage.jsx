import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="not-found-page">
      <h1>404 Not Found</h1>
      <p>The page you're looking for doesn't exist.</p>
      <Link to="/" className="link-text">
        Dawit Develops
      </Link>
    </div>
  );
}
