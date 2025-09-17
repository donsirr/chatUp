import React, { useState } from "react";
import LandingPage from "./LandingPage"; // import the new page
import ChatApp from "./ChatApp"; // your existing chat code

export default function App() {
  const [agreed, setAgreed] = useState(false);

  if (!agreed) {
    return <LandingPage onAgree={() => setAgreed(true)} />;
  }

  return <ChatApp />;
}
