from fastapi import APIRouter

router = APIRouter()


@router.post("/register")
async def register():
    return {"message": "TODO: implement registration"}


@router.post("/login")
async def login():
    return {"message": "TODO: implement login"}
