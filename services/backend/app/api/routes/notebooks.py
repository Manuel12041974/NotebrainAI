from fastapi import APIRouter

router = APIRouter()


@router.get("/")
async def list_notebooks():
    return {"notebooks": []}


@router.post("/")
async def create_notebook():
    return {"message": "TODO: create notebook"}


@router.get("/{notebook_id}")
async def get_notebook(notebook_id: str):
    return {"id": notebook_id}


@router.delete("/{notebook_id}")
async def delete_notebook(notebook_id: str):
    return {"message": "deleted"}
