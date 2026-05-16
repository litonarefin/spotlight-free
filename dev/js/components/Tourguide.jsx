import { TourGuideClient } from "@sjmc11/tourguidejs/dist/tour";
import { useEffect } from "react";
import { useStore } from "../store/useStore";
import apiFetch from "@wordpress/api-fetch";
import { addQueryArgs } from "@wordpress/url";
import { isMac } from "../utils/device";

const Tourguide = () => {
  const [backspace, setStore] = useStore((store) => store.backspace);

  useEffect(() => {
    let step = 1;
    localStorage.removeItem("tourCompleted");

    // Define the steps for the tour
    const steps = [
      {
        content: `
          <div>
            <p>Press ${
              isMac
                ? "<mark><strong>⌥ + S</strong></mark>"
                : "<mark><strong>Alt + S</strong></mark>"
            } to Open Spotlight.</p>
            <p>Press <mark><strong>ESC</strong></mark> to Close Spotlight.</p>
            <p>Let us give you a demo of the search capabilities with "<code><strong>Post Types</strong></code>"</p>
          </div>
        `,
        title: "Welcome To Spotlight",
        target: ".jltwp-spotlight-search-wrapper", // ID or class of the HTML element to target
        order: 1,
        group: "onboarding",
        dialogPlacement: "top",
      },
      {
        content: `
          <div>
            <p>From Post Types > Pick the post type > You can select a post from the options or type in directly the title of the post. We've selected first post from your posts. Congrats! You just searched your first post.
            <br/>
            <br/>
            Now just hit "finish" to set up your <mark>Custom Key Bindings</mark></p>
          </div>
        `,
        title: "How to search for a specific post",
        target: ".jltwp-spotlight-search-wrapper",
        // ID or class of the HTML element to target
        order: 2,
        group: "onboarding",
        dialogPlacement: "top",
      },
    ];

    // Initialize the TourGuideClient with defined steps
    const tg = new TourGuideClient({
      steps: steps,
      exitOnClickOutside: false,
      dialogZ: 9999999999999,
      hidePrev: true,
      backdropClass: "jltwp-spotlight-backdrop",
    });

    // Start the tour
    tg.start();

    tg.onAfterStepChange(() => {
      step += 1;
      if (step === 2) {
        setStore({
          selectedCategory: [
            {
              id: "post_types",
              title: "Post Types",
              url: "",
              icon: "filePlus",
              direction: "cornerRightUp",
              dependency: true,
              tags: [
                {
                  name: "Alt",
                  bg: true,
                },
                {
                  name: "+",
                },
                {
                  name: "Shift",
                  bg: true,
                },
                {
                  name: "+",
                },
                {
                  name: "P",
                  bg: true,
                },
              ],
              shortcutKey: "Alt+Shift+P",
            },
            {
              title: "Posts",
              slug: "post",
              url: "",
              icon: "",
              dependency: true,
              direction: "cornerRightUp",
              callback: true,
            },
          ],
          // searchText: "Hello World",
          backspace: !backspace,
        });
      }
    });

    // Listen for the tour finished event
    tg.onFinish(() => {
      setStore({ openSettings: true, openPopup: false });
      localStorage.setItem("tourCompleted", true);

      const queryParams = { tour_completed: true };
      const path = addQueryArgs("save-tour-status", queryParams);

      apiFetch({
        path: path,
        method: "POST",
      })
        .then((response) => {
          // console.log("Tour completion status saved:", response);
        })
        .catch((error) => {
          // console.error("Error saving tour status:", error);
        });
    });
  }, []);

  return null;
};

export default Tourguide;
