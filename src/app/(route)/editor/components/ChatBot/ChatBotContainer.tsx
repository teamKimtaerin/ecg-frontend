'use client'

import React from 'react'
import ChatBotModal from './ChatBotModal'
import ChatBotFloatingButton from './ChatBotFloatingButton'
import useChatBot from '../../hooks/useChatBot'

const ChatBotContainer: React.FC = () => {
  const { messages, isTyping, isOpen, sendMessage, openChatBot, closeChatBot } =
    useChatBot()

  return (
    <>
      <ChatBotFloatingButton onClick={openChatBot} hasUnreadMessages={false} />

      <ChatBotModal
        isOpen={isOpen}
        onClose={closeChatBot}
        messages={messages}
        isTyping={isTyping}
        onSendMessage={sendMessage}
      />
    </>
  )
}

export default ChatBotContainer
