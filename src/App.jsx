import MDRender from "./MDRender";
import "./App.scss";
import { useEffect, useRef, useState } from "react";
import icon_explorer from "../src/assets/icon-explorer.svg";
import dog from "../src/assets/new_dog.svg";
import ground from "../src/assets/ground.svg";
import little_dog from "../src/assets/new_little_dog.svg";
import Sidebar from "./components/Sidebar";
import { useSelector } from "react-redux";

function App() {
  const [explorer_opened, set_explorer_opened] = useState(false);
  const [sidebar_content_visible, set_sidebar_content_visible] =
    useState(false);

  const little_dog_ref = useRef(null);
  const header_ref = useRef(null);
  const dog_ref = useRef(null);

  const is_content_loaded = useSelector((state) => state.content.is_loaded);
  const is_resizing = useSelector((state) => state.resize.is_resizing);

  const random_number = Math.floor(Math.random() * (1000 - 300)) + 300;

  const handle_explorer_click = () => {
    if (explorer_opened) {
      set_explorer_opened(false);
      set_sidebar_content_visible(false);

      header_ref.current.style.paddingLeft = "5rem";
      // dog_ref.current.classList.remove("dog_animation");
    } else {
      set_explorer_opened(true);

      header_ref.current.style.paddingLeft = "2.5rem";
      // dog_ref.current.classList.add("dog_animation");

      set_sidebar_content_visible(true);
    }
  };

  useEffect(() => {
    if (is_content_loaded) {
      setTimeout(() => {
        little_dog_ref.current.classList.add("little_dog_animation");
      }, random_number);
    }
  }, [is_content_loaded]);

  return (
    <div
      className="App"
      id={is_resizing ? "sidebar_resizing" : ""}
    >
      <Sidebar
        explorer_opened={explorer_opened}
        sidebar_content_visible={sidebar_content_visible}
      />
      <div className="content_section">
        <div
          className="header"
          ref={header_ref}
          data-tauri-drag-region
        >
          <img
            src={icon_explorer}
            alt="icon explorer"
            className="my_icon explorer_icon"
            onClick={handle_explorer_click}
          />
          <h1 className="my_h1">MDog</h1>
          <img
            src={little_dog}
            alt="little dog"
            className="my_icon little_dog"
            ref={little_dog_ref}
          />
        </div>
        {is_content_loaded ? (
          <MDRender />
        ) : (
          <div className="main_content">
            <p className="my_p">
              Welcome to the MDog - a simple app to read <span>doguments</span>
            </p>
            <div className="icon_wrapper">
              <img
                src={dog}
                alt="dog"
                className="my_icon dog"
                ref={dog_ref}
              />
              <img
                src={ground}
                alt="ground"
                className="my_icon ground"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
