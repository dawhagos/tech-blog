import Post from "../Post";
import { useEffect, useState } from "react";

export default function IndexPage() {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    fetch(`${import.meta.env.VITE_APP_API_URL}/post`)
      .then((response) => response.json())
      .then((posts) => {
        setPosts(posts);
        setIsLoading(false);
      });
  }, []);
  return (
    <>
      {isLoading ? (
        <div className="spinner-container">
          <div className="loading-spinner"></div>
        </div>
      ) : (
        <>
          {posts.length > 0 &&
            posts.map((post) => <Post key={post._id} {...post} />)}
        </>
      )}
    </>
  );
}
