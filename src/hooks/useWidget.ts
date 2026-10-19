import { useEffect, useState } from "react";
import { onAppEvent, setWidget } from "../platform";

const KEY = "tomo-widget";

/** Whether the desktop widget is open. If it was left open, it comes back on the next launch. */
export function useWidget(): [boolean, (on: boolean) => void] {
  const [on, setOn] = useState(() => localStorage.getItem(KEY) === "1");

  useEffect(() => {
    if (on) setWidget(true);
    // the widget can also be closed from its own window
    return onAppEvent<boolean>("tomo:widget", (open) => {
      setOn(open);
      if (open) localStorage.setItem(KEY, "1");
      else localStorage.removeItem(KEY);
    });
  }, []);

  return [on, setWidget];
}
