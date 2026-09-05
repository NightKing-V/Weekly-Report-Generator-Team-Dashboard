"""LangGraph Groq Chatbot Workflow with Lightweight RAG.

Orchestrates:
- QnA Node powered by minimal, lightweight RAG using LangChain & ChatGroq.
- 5-Response Rolling Summarizer using Groq LLM under app.llm.
- In-memory session MemorySaver (no permanent MongoDB persistence).
"""

from typing import Annotated, List, Optional, TypedDict, Literal
import logging
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langgraph.checkpoint.memory import MemorySaver

from app.llm import LLMFactory, LLMTier
from app.services.chat.rag import run_rag

logger = logging.getLogger("app.services.chat.graph")


class ChatState(TypedDict):
    messages: Annotated[List[BaseMessage], add_messages]
    response_count: int
    summary: str
    week_label: Optional[str]
    sources_count: Optional[int]


async def qna_node(state: ChatState) -> dict:
    """Core QnA Node: Evaluates user query using lightweight LangChain RAG.
    
    Retrieves grounded weekly report context from MongoDB, synthesizes the answer,
    and increments the session response counter.
    """
    week_label = state.get("week_label") or "Week 36 (Aug 31 - Sep 06, 2026)"
    rolling_summary = state.get("summary") or ""

    # Extract latest human query
    last_query = ""
    for m in reversed(state["messages"]):
        if isinstance(m, HumanMessage):
            last_query = str(m.content)
            break

    if not last_query:
        last_query = "Summarize weekly reports and team status"

    # Invoke Lightweight RAG
    rag_result = await run_rag(
        query=last_query,
        selected_week=week_label,
        rolling_summary=rolling_summary,
    )

    reply_text = rag_result.get("reply", "")
    new_count = state.get("response_count", 0) + 1

    return {
        "messages": [AIMessage(content=reply_text)],
        "response_count": new_count,
        "sources_count": rag_result.get("sources_count", 0),
    }


async def summarize_node(state: ChatState) -> dict:
    """Summarizer Node: Executes every 5 responses.
    
    Compresses conversation history into a structured rolling summary to maintain long-running context.
    Uses Groq LLM client initialized via app.llm.
    """
    try:
        llm = LLMFactory.get_llm(LLMTier.SMALL)
    except Exception as e:
        logger.warning(f"Could not initialize LLM for summarizer: {e}")
        llm = None
    existing_summary = state.get("summary") or "None"
    current_count = state.get("response_count", 0)

    # Format recent conversation turns
    recent_dialogue = []
    for m in state["messages"][-10:]:
        role = "User" if isinstance(m, HumanMessage) else "Assistant"
        if isinstance(m, (HumanMessage, AIMessage)):
            recent_dialogue.append(f"{role}: {m.content}")

    dialogue_str = "\n".join(recent_dialogue)

    prompt = (
        f"You are the conversation summarizer. We have completed {current_count} responses.\n"
        f"Existing summary so far:\n{existing_summary}\n\n"
        f"Recent conversation turns:\n{dialogue_str}\n\n"
        "Create an updated, concise rolling summary (maximum 150 words) capturing:\n"
        "1. Key user questions and team areas inquired about.\n"
        "2. Key facts learned about team deliverables, blockers, or metrics.\n"
        "3. Any ongoing decisions or recommendations."
    )

    if llm:
        try:
            summary_response = await llm.ainvoke([HumanMessage(content=prompt)])
            new_summary = str(summary_response.content).strip()
        except Exception as e:
            logger.warning(f"Error generating summary with Groq: {e}")
            new_summary = f"Summary at response {current_count}: Discussed team reports, deliverables, and blockers for {state.get('week_label', 'current week')}."
    else:
        new_summary = f"Summary at response {current_count}: Discussed weekly team deliverables, blockers, and KPI compliance for {state.get('week_label', 'current week')}."

    return {
        "summary": new_summary,
    }


def should_route_qna(state: ChatState) -> Literal["summarize_node", "__end__"]:
    """Conditional Edge:
    
    If response_count > 0 and response_count % 5 == 0 -> route to summarize_node.
    Otherwise -> end turn.
    """
    count = state.get("response_count", 0)
    if count > 0 and count % 5 == 0:
        return "summarize_node"
    return END


# -------------------------------------------------------------
# Construct LangGraph StateGraph
# -------------------------------------------------------------
builder = StateGraph(ChatState)

# 1. Add Nodes
builder.add_node("qna_node", qna_node)
builder.add_node("summarize_node", summarize_node)

# 2. Add Edges
builder.add_edge(START, "qna_node")
builder.add_conditional_edges("qna_node", should_route_qna, ["summarize_node", END])
builder.add_edge("summarize_node", END)

# 3. Compile with in-memory checkpointer (session-only memory, cleared on refresh/restart)
chat_checkpointer = MemorySaver()
chat_graph = builder.compile(checkpointer=chat_checkpointer)
