import { useLoaderData, useLocation } from "react-router";

export async function loader() {
   return {
      CHAT_URL: import.meta.env.VITE_CHAT_URL,
   };
}

const SingleChatWrapper = () => {
   const location = useLocation();
   const { CHAT_URL } = useLoaderData() as { CHAT_URL: string };
   const queryParams = new URLSearchParams(location.search);
   const id = queryParams.get("id");

   console.log("Paokue URL");
   console.log("Url:", `${CHAT_URL}chat?id=${id}`);

   return (
      <div style={{ width: "100%", height: "100vh" }}>
         <iframe
            src={`${CHAT_URL}chat?id=${id}`}
            style={{ width: "100%", height: "100%", border: "none" }}
            title="Realtime Chat"
         />
      </div>
   );
};

export default SingleChatWrapper;
