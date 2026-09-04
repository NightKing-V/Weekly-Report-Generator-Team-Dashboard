"""
Chat Service Layer.
Connects FastAPI endpoints with the LangGraph Groq Chatbot workflow.
"""
from typing import Optional, Dict, Any
from langchain_core.messages import HumanMessage, AIMessage, ToolMessage
from app.services.chat.graph import chat_graph
from app.models.chats import ChatQueryResponse


class ChatService:
    def __init__(self):
        self.graph = chat_graph

    async def generate_chat_response(
        self,
        query: str,
        week_label: Optional[str] = None,
        thread_id: Optional[str] = None,
        user_id: Optional[str] = None,
    ) -> ChatQueryResponse:
        """
        Execute LangGraph StateGraph over the session thread.
        Maintains conversational memory in-memory for the duration of the session.
        """
        effective_thread_id = thread_id or user_id or "default_session"
        config = {"configurable": {"thread_id": effective_thread_id}}

        input_state = {
            "messages": [HumanMessage(content=query)],
            "week_label": week_label,
        }

        try:
            result = await self.graph.ainvoke(input_state, config=config)
        except Exception as e:
            print(f"[ChatService] Error executing LangGraph: {e}")
            return ChatQueryResponse(
                reply=f"An error occurred while processing your query with the AI assistant: {str(e)}",
                sourcesCount=0,
                threadId=effective_thread_id,
                responseCount=0,
                summary="",
            )

        messages = result.get("messages", [])
        response_count = result.get("response_count", 0)
        summary = result.get("summary", "")

        # Find the last AIMessage for the answer
        reply_text = ""
        for m in reversed(messages):
            if isinstance(m, AIMessage) and m.content:
                reply_text = str(m.content)
                break

        if not reply_text:
            reply_text = "I processed your request, but could not produce a text summary. Please ask again."

        # Count tool invocations as sourcesCount
        sources_count = sum(1 for m in messages if isinstance(m, ToolMessage))

        return ChatQueryResponse(
            reply=reply_text,
            sourcesCount=sources_count,
            threadId=effective_thread_id,
            responseCount=response_count,
            summary=summary,
        )


chat_service = ChatService()
