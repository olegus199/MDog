import { useEffect, useRef, useState } from "react";
// import MarkdownIt from "markdown-it";
// import doMarkdownIt from "@digitalocean/do-markdownit";
// import "../node_modules/@digitalocean/do-markdownit/styles/index.scss";
// import "../node_modules/@digitalocean/do-markdownit/styles/digitalocean/index.scss";
import "./MDRender.scss";
import { useSelector } from "react-redux";

export default function MDRender() {
  const md = new MarkdownIt().use(doMarkdownIt);
  const ref = useRef(null);

  const md_content = useSelector((state) => state.content.md_content);

  useEffect(() => {
    const element = ref.current;
    element.innerHTML = md_content;
  }, [md_content]);

  return (
    <div
      className="output"
      ref={ref}
      id="output"
    ></div>
  );
}
