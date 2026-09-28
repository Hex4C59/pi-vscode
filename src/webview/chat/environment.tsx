import { createContext, useContext } from "react";

/** Presentation environment only; never grants a host capability. */
export const ChatPreviewContext = createContext(false);
export const useChatPreview = () => useContext(ChatPreviewContext);
