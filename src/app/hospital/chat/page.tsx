export type ConversationRow = {
  id: string
  type: string
  name: string | null
  last_message_at: string | null
  _unread: number
}

export default function ChatIndexPage() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <svg
          className="mx-auto mb-4 h-12 w-12 text-neutral-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        <p className="text-sm font-medium text-neutral-500">
          Select a conversation or start a new one
        </p>
        <a
          href="/hospital/chat/new"
          className="mt-3 inline-block rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          New conversation
        </a>
      </div>
    </div>
  )
}
