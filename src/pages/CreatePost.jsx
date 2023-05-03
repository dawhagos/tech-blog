import "react-quill/dist/quill.snow.css";
import { useState } from "react";
import { Navigate } from "react-router-dom";
import Editor from "../Editor";

export default function CreatePost() {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [files, setFiles] = useState("");
  const [redirect, setRedirect] = useState(false);

  function handleFileChange(ev) {
    if (ev.target.files[0].size > 2 * 1024 * 1024) {
      alert("File too large");
    } else {
      setFiles(ev.target.files);
    }
  }

  async function createNewPost(ev) {
    ev.preventDefault();
    // if (!files) {
    //   alert("No file selected");
    //   return;
    // }

    const data = new FormData();
    data.set("title", title);
    data.set("summary", summary);
    data.set("content", content);
    if (!files) {
      data.set("file", "unsplash");
    } else {
      data.set("file", files[0]);
    }
    const response = await fetch(`${import.meta.env.VITE_APP_API_URL}/post`, {
      method: "POST",
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
        setRedirect(true);
      }
      alert(error);
    }
  }

  if (redirect) {
    return <Navigate to={"/"} />;
  }
  return (
    <form onSubmit={createNewPost}>
      <div className="notice-bar">
        Notice: Currently all images are not being saved so your post will
        utilize a template image. Sorry for the inconveinience!
      </div>
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
      <Editor value={content} onChange={setContent} />
      <button className="main-btn" style={{ marginTop: "5px" }}>
        Create post
      </button>
    </form>
  );
}
