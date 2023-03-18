import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import Editor from "../Editor";

export default function EditPost() {
  const { id } = useParams();
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [files, setFiles] = useState("");
  const [redirect, setRedirect] = useState(false);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_APP_API_URL}/post/` + id).then((response) => {
      response.json().then((postInfo) => {
        setTitle(postInfo.title);
        setContent(postInfo.content);
        setSummary(postInfo.summary);
      });
    });
  }, []);

  function handleFileChange(ev) {
    if (ev.target.files[0].size > 2 * 1024 * 1024) {
      alert("File too large");
    } else {
      setFiles(ev.target.files);
    }
  }

  async function updatePost(ev) {
    ev.preventDefault();
    if (!files) {
      alert("No file selected");
      return;
    }
    const data = new FormData();
    data.set("title", title);
    data.set("summary", summary);
    data.set("content", content);
    data.set("id", id);
    if (files?.[0]) {
      data.set("file", files[0]);
    }
    const response = await fetch(`${import.meta.env.VITE_APP_API_URL}/post`, {
      method: "PUT",
      body: data,
      credentials: "include",
    });
    if (response.ok) {
      setRedirect(true);
    } else {
      const { error } = await response.json();
      if (error === "Unauthorized - Token Expired") {
        document.cookie =
          "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        setExpired(true);
      }
      alert(error);
    }
  }

  if (expired) {
    return <Navigate to={"/"} />;
  }

  if (redirect) {
    return <Navigate to={"/post/" + id} />;
  }

  return (
    <form onSubmit={updatePost}>
      <input
        type="title"
        placeholder={"Title"}
        value={title}
        onChange={(ev) => setTitle(ev.target.value)}
      />
      <input
        type="summary"
        placeholder={"Summary"}
        value={summary}
        onChange={(ev) => setSummary(ev.target.value)}
      />
      <input type="file" onChange={handleFileChange} />
      <Editor onChange={setContent} value={content} />
      <button className="main-btn" style={{ marginTop: "5px" }}>
        Update post
      </button>
    </form>
  );
}
