import ScrollableFeed from "react-scrollable-feed";
import { VscCircleFilled } from "react-icons/vsc";

function ChatHistory({
  chatHistory,
  chatHistoryLoading,
  loggedUserId,
  dateFormat,
  enterChat,
}) {
  return (
    <div id="chat-history">
      {chatHistoryLoading ? (
        <p className="loading">Loading chat history...</p>
      ) : (
        <ScrollableFeed>
          {chatHistory.map((chat) => {
            if (!chat.title) console.log(chat);
            const lastMessage = chat.lastMessage;
            if (!lastMessage) return null;
            const sender =
              chat.lastMessage.sender === loggedUserId ? "You: " : "";
            return (
              <div
                className="chat-history-item"
                key={chat.id}
                onClick={() => enterChat(chat)}
              >
                <div id="conversation-details">
                  <div className="unread-marker-container">
                    {chat.new && <VscCircleFilled className="unread-marker" />}
                  </div>
                  <img
                    className="profile-img"
                    src={chat.imageURL}
                    alt={`${chat.title} profile`}
                  ></img>
                  <h4>{chat.title}</h4>
                  <h6 className="badge" hidden={true}>
                    New
                  </h6>
                </div>
                <div id="last-message">
                  <p>{sender + lastMessage.message}</p>
                  <small>{dateFormat(lastMessage.createdAt)}</small>
                </div>
                <hr></hr>
              </div>
            );
          })}
        </ScrollableFeed>
      )}
    </div>
  );
}

export default ChatHistory;
