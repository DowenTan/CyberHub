from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from langchain_core.tools import tool
from langchain_ollama import ChatOllama # Or ChatGoogleGenerativeAI / ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage, ToolMessage
from core.database import supabase

router = APIRouter(prefix="/api/admin/copilot", tags=["AI Copilot"])

# 1. Define Executable Admin Tools
@tool
def update_global_pricing(diagnostic_fee: float = None, standard_labor_rate: float = None, emergency_multiplier: float = None) -> dict:
    """Updates global pricing rates (diagnostic fee, labor rate, or emergency multiplier) in RM."""
    update_payload = {k: v for k, v in {
        "diagnostic_fee": diagnostic_fee,
        "standard_labor_rate": standard_labor_rate,
        "emergency_multiplier": emergency_multiplier
    }.items() if v is not None}

    res = supabase.table("global_settings").update(update_payload).eq("id", 1).execute()
    return {"status": "success", "action": "REFRESH_PRICING", "updated": update_payload}

@tool
def update_spare_part_markup(sku: str, markup_percentage: int) -> dict:
    """Updates the markup percentage of a specific spare part by SKU (e.g., PRT-001) and recalculates final price."""
    part = supabase.table("spare_parts_catalog").select("supplier_cost").eq("sku", sku).single().execute()
    if not part.data:
        return {"status": "error", "message": f"SKU {sku} not found."}
    
    cost = float(part.data["supplier_cost"])
    final_price = cost + (cost * (markup_percentage / 100))
    
    supabase.table("spare_parts_catalog").update({
        "markup_percentage": markup_percentage,
        "final_price": final_price
    }).eq("sku", sku).execute()
    
    return {"status": "success", "action": "REFRESH_PRICING", "sku": sku, "new_price": final_price}

@tool
def dispatch_technician_to_order(booking_number: str, employee_code: str) -> dict:
    """Manually assigns a field technician to a repair request by booking number and employee code."""
    supabase.table("repair_requests").update({
        "status": "DISPATCHED",
        "assigned_employee_code": employee_code
    }).eq("booking_number", booking_number).execute()
    
    return {"status": "success", "action": "REFRESH_ORDERS", "booking": booking_number, "tech": employee_code}

# Bind tools to the LLM
tools = [update_global_pricing, update_spare_part_markup, dispatch_technician_to_order]
tools_map = {t.name: t for t in tools}

# You can swap ChatOllama for Gemini or OpenAI API easily
llm = ChatOllama(model="qwen2.5:7b", temperature=0).bind_tools(tools)

class ChatRequest(BaseModel):
    messages: List[Dict[str, str]]
    current_page: str

@router.post("/chat")
async def process_admin_command(req: ChatRequest):
    chat_history = [
        SystemMessage(content=(
            f"You are the CyberHub Admin Operations AI. The admin is currently viewing '{req.current_page}'. "
            "Use your bound tools whenever the admin asks to modify prices, update parts, or dispatch orders. "
            "Be concise and confirm exact values changed."
        ))
    ]
    
    for m in req.messages:
        if m["role"] == "user":
            chat_history.append(HumanMessage(content=m["content"]))
        elif m["role"] == "assistant":
            chat_history.append(AIMessage(content=m["content"]))

    # Invoke model
    ai_msg = llm.invoke(chat_history)
    ui_triggers = []

    # Check if the AI decided to run one or more admin tools
    if ai_msg.tool_calls:
        chat_history.append(ai_msg)
        for tool_call in ai_msg.tool_calls:
            tool_fn = tools_map.get(tool_call["name"])
            if tool_fn:
                result = tool_fn.invoke(tool_call["args"])
                if "action" in result:
                    ui_triggers.append(result["action"])
                chat_history.append(ToolMessage(content=str(result), tool_call_id=tool_call["id"]))
        
        # Get final natural-language summary from the LLM after tool execution
        final_response = llm.invoke(chat_history)
        reply_text = final_response.content
    else:
        reply_text = ai_msg.content

    return {
        "reply": reply_text,
        "ui_triggers": ui_triggers # Tells the React frontend which tables/charts to re-fetch!
    }