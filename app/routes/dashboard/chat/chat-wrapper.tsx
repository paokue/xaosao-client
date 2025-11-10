import { useLoaderData } from "react-router";

export async function loader() {
   return {
      CHAT_URL: import.meta.env.VITE_CHAT_URL,
   };
}

const ChatWrapper = () => {
   const { CHAT_URL } = useLoaderData() as { CHAT_URL: string };

   return (
      <div style={{ width: "100%", height: "100vh" }}>
         <iframe
            src={`${CHAT_URL}/contact-list`}
            style={{ width: "100%", height: "100%", border: "none" }}
            title="Realtime Chat"
         />
      </div>
   );
};

export default ChatWrapper;
