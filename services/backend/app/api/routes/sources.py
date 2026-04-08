from fastapi import APIRouter, UploadFile

router = APIRouter()


@router.get("/{notebook_id}")
async def list_sources(notebook_id: str):
    return {"sources": []}


@router.post("/{notebook_id}/upload")
async def upload_source(notebook_id: str, file: UploadFile):
    return {"message": f"TODO: process {file.filename}"}


@router.post("/{notebook_id}/url")
async def add_url_source(notebook_id: str):
    return {"message": "TODO: add URL source"}


@router.delete("/{source_id}")
async def delete_source(source_id: str):
    return {"message": "deleted"}
