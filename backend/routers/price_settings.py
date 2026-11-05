from fastapi import APIRouter, HTTPException, Depends
from core.database import supabase
from models.pricing import GlobalPrices, SparePartUpdate

router = APIRouter(prefix="/api/admin/pricing", tags=["Price Settings"])

@router.get("/global")
async def get_global_prices():
    # Fetch global rates from Supabase
    response = supabase.table('global_settings').select('*').single().execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Pricing settings not found")
    return response.data

@router.post("/global")
async def update_global_prices(prices: GlobalPrices):
    # Update global rates in Supabase
    data = {
        "diagnostic_fee": prices.diagnostic_fee,
        "standard_labor_rate": prices.standard_labor_rate,
        "emergency_multiplier": prices.emergency_multiplier
    }
    response = supabase.table('global_settings').update(data).eq('id', 1).execute()
    return {"message": "Prices updated successfully", "data": response.data}

@router.patch("/parts/{sku}")
async def update_spare_part(sku: str, part: SparePartUpdate):
    # Calculate final price natively on the backend before saving
    final_price = part.supplier_cost + (part.supplier_cost * (part.markup_percentage / 100))
    
    data = {
        "markup_percentage": part.markup_percentage,
        "supplier_cost": part.supplier_cost,
        "final_price": final_price,
        "is_active": part.is_active
    }
    
    response = supabase.table('spare_parts_catalog').update(data).eq('sku', sku).execute()
    return {"message": f"Part {sku} updated", "final_price": final_price}