"""RTO lookup router - training.gov.au and CRICOS lookups."""

import httpx
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.database import get_db
from src.models import RTOOrganisation
from src.schemas import RTOLookupResponse, CRICOSLookupResponse, RTOOrganisationResponse
from src.config import get_settings

settings = get_settings()
router = APIRouter(prefix="/api/rto", tags=["rto"])


async def lookup_training_gov_au(rto_number: str) -> Optional[dict]:
    """Lookup RTO data from training.gov.au API."""
    # In production, this would call the actual training.gov.au API
    # For now, return mock data
    mock_data = {
        "rto_number": rto_number,
        "name": f"Training Organisation {rto_number}",
        "status": "active",
        "cricos_provider_code": f"0{rto_number[:4]}",
        "address": "123 Training Street, Sydney NSW 2000",
        "scope": "National Training Package",
    }
    return mock_data


async def lookup_cricos(provider_code: str) -> Optional[dict]:
    """Lookup CRICOS provider data."""
    # In production, this would call the CRICOS API
    # For now, return mock data
    mock_data = {
        "provider_code": provider_code,
        "name": f"CRICOS Provider {provider_code}",
        "status": "registered",
        "courses": [
            "Certificate IV in Training and Assessment",
            "Diploma of VET Management",
        ],
    }
    return mock_data


@router.get("/lookup/{rto_number}", response_model=RTOLookupResponse)
async def lookup_rto(
    rto_number: str,
    db: AsyncSession = Depends(get_db),
):
    """Lookup RTO from training.gov.au provider registry."""
    # First check local database
    query = select(RTOOrganisation).where(RTOOrganisation.rto_number == rto_number)
    result = await db.execute(query)
    rto = result.scalar_one_or_none()

    if rto:
        return RTOLookupResponse(
            rto_number=rto.rto_number,
            name=rto.name,
            status=rto.status,
            cricos_provider_code=rto.cricos_provider_code,
        )

    # Lookup from training.gov.au
    data = await lookup_training_gov_au(rto_number)

    if not data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"RTO {rto_number} not found",
        )

    return RTOLookupResponse(**data)


@router.get("/cricos/{code}", response_model=CRICOSLookupResponse)
async def lookup_cricos_provider(
    code: str,
    db: AsyncSession = Depends(get_db),
):
    """Lookup CRICOS provider by code."""
    data = await lookup_cricos(code)

    if not data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"CRICOS provider {code} not found",
        )

    return CRICOSLookupResponse(**data)


@router.post("/", response_model=RTOOrganisationResponse)
async def create_rto(
    rto_data: dict,
    db: AsyncSession = Depends(get_db),
):
    """Create a new RTO organisation (admin only)."""
    rto = RTOOrganisation(**rto_data)
    db.add(rto)
    await db.flush()
    await db.refresh(rto)
    return rto
