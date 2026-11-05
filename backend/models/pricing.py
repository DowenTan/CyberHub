from pydantic import BaseModel
from typing import Optional

class GlobalPrices(BaseModel):
    diagnostic_fee: float
    standard_labor_rate: float
    emergency_multiplier: float

class SparePartUpdate(BaseModel):
    sku: str
    markup_percentage: int
    supplier_cost: float
    is_active: bool