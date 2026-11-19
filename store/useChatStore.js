import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useChatStore = create(
  persist(
    (set) => ({
      isOpen: true,
      messages: [
        {
          role: 'assistant',
          content:
            'CyberHub Admin Copilot online. Try commands like:\n• "Set diagnostic fee to RM 65"\n• "Change PRT-045 markup to 60%"\n• "Dispatch T-092 to ORD-882"\n• "Zoom graph to May"',
          triggers: [],
          timestamp: new Date().toISOString(),
        },
      ],
      toggleChat: () => set((state) => ({ isOpen: !state.isOpen })),
      addMessage: (msg) =>
        set((state) => ({
          messages: [...state.messages, { ...msg, timestamp: new Date().toISOString() }],
        })),
      deleteMessageTurn: (userMsgIndex) =>
        set((state) => {
          const msgs = [...state.messages];
          if (userMsgIndex < 0 || userMsgIndex >= msgs.length) return state;
          let countToDelete = 1;
          while (
            userMsgIndex + countToDelete < msgs.length &&
            msgs[userMsgIndex + countToDelete].role === 'assistant'
          ) {
            countToDelete++;
          }
          msgs.splice(userMsgIndex, countToDelete);
          return { messages: msgs };
        }),
      clearHistory: () =>
        set({
          messages: [
            {
              role: 'assistant',
              content: 'Chat history cleared. Ready for admin commands.',
              triggers: [],
              timestamp: new Date().toISOString(),
            },
          ],
        }),
    }),
    {
      name: 'cyberhub-admin-ai-storage-v1',
    }
  )
);