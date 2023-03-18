import { formatISO9075 } from "date-fns";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

export default function Post({
  _id,
  title,
  summary,
  cover,
  content,
  createdAt,
  author,
}) {
  const [imageSrc, setImageSrc] = useState(null);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_APP_API_URL}/${cover}`)
      .then((response) => {
        if (!response.ok) {
          fetch(`${import.meta.env.VITE_APP_API_URL}/random`)
            .then((response) => response.text())
            .then((data) => {
              const parsedData = JSON.parse(data);
              setImageSrc(parsedData.imageSrc);
            })
            .catch((error) => console.error(error));
        } else {
          setImageSrc(`${import.meta.env.VITE_APP_API_URL}/${cover}`);
        }
      })
      .catch((error) => {
        console.error(error);
      });
  }, [cover]);

  return (
    <div className="post">
      <div className="image">
        {imageSrc ? (
          <Link to={`/post/${_id}`}>
            <img src={imageSrc} alt="" />
          </Link>
        ) : (
          <div className="loading">Loading...</div>
        )}
      </div>

      <div className="texts">
        <Link to={`/post/${_id}`}>
          <h2>{title}</h2>
        </Link>
        <p className="info">
          <a className="author">{author.username}</a>
          <time>{formatISO9075(new Date(createdAt))}</time>
        </p>
        <p className="summary">{summary}</p>
      </div>
    </div>
  );
}
