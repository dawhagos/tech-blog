import { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { formatISO9075 } from "date-fns";
import { UserContext } from "../UserContext";
import { Link } from "react-router-dom";
import NotFoundPage from "./NotFoundPage";

export default function PostPage() {
  const [postInfo, setPostInfo] = useState(null);
  const [error, setError] = useState(null);
  const { userInfo } = useContext(UserContext);
  const { id } = useParams();
  useEffect(() => {
    fetch(`${import.meta.env.VITE_APP_API_URL}/post/${id}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Post not found");
        }
        return response.json();
      })
      .then((postInfo) => {
        setPostInfo(postInfo);
      })
      .catch((error) => {
        setError(error);
      });
  }, [id]);

  if (error) {
    return <NotFoundPage />;
  }

  if (!postInfo) return "";

  const handleDelete = async (postId) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_APP_API_URL}/post/${postId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );
      if (response.ok) {
        window.location.href = "/";
      } else {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete post");
      }
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  return (
    <div className="post-page">
      <h1>{postInfo.title}</h1>
      <time>{formatISO9075(new Date(postInfo.createdAt))}</time>
      <div className="author">by @{postInfo.author.username}</div>
      {userInfo.id === postInfo.author._id && (
        <div className="edit-row">
          <Link className="edit-btn" to={`/edit/${postInfo._id}`}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
              />
            </svg>
            Edit this post
          </Link>
          <button
            className="delete-btn"
            onClick={() => handleDelete(postInfo._id)}
          >
            Delete
          </button>
        </div>
      )}
      <div className="image">
        <a href={postInfo.imageSrc} target="_blank" rel="noopener noreferrer">
          <img src={postInfo.imageSrc} alt="" />
        </a>
        <div className="photographer">
          Photo by{" "}
          <a
            href={`https://unsplash.com/@${postInfo.photographerUsername}?utm_source=your_app_name&utm_medium=referral`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <u>{postInfo.photographerName}</u>
          </a>{" "}
          on{" "}
          <a
            href="https://unsplash.com/?utm_source=your_app_name&utm_medium=referral"
            target="_blank"
            rel="noopener noreferrer"
          >
            <u>Unsplash</u>
          </a>
          .
        </div>
      </div>
      <div
        className="content"
        dangerouslySetInnerHTML={{ __html: postInfo.content }}
      />
    </div>
  );
}
