import uuid
from datetime import datetime
from typing import List
from fastapi import APIRouter, HTTPException, status
from app.models.users import UserModel, UserCreate, UserUpdateRole, LoginRequest
from app.repositories.user_repository import user_repository

router = APIRouter(prefix="/api/users", tags=["Users"])


@router.get("", response_model=List[UserModel])
async def list_users():
    """Retrieve all users in the workspace."""
    users = await user_repository.get_all_users()
    return users


@router.get("/{user_id}", response_model=UserModel)
async def get_user(user_id: str):
    """Retrieve a single user by ID."""
    user = await user_repository.get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id '{user_id}' was not found.",
        )
    return user


@router.post("/login", response_model=UserModel)
async def login_user(payload: LoginRequest):
    """Authenticate or find user by email. If not found, create a demo profile."""
    user = await user_repository.get_user_by_email(payload.email)
    if not user:
        # If user does not exist, create demo account
        name_part = payload.email.split("@")[0].replace(".", " ").title()
        new_user = {
            "id": f"user-{uuid.uuid4().hex[:8]}",
            "name": name_part,
            "email": payload.email,
            "role": payload.role or "team_member",
            "title": "Software Engineer",
            "department": "Engineering",
            "createdAt": datetime.utcnow().isoformat() + "Z",
        }
        return await user_repository.create_user(new_user)
    return user


@router.post("", response_model=UserModel, status_code=status.HTTP_201_CREATED)
async def create_user(payload: UserCreate):
    """Invite or add a new team member."""
    existing = await user_repository.get_user_by_email(payload.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User with email '{payload.email}' already exists.",
        )

    user_dict = {
        "id": f"user-{uuid.uuid4().hex[:8]}",
        "name": payload.name,
        "email": payload.email,
        "role": payload.role,
        "title": payload.title or "Software Engineer",
        "department": payload.department or "Engineering",
        "avatarUrl": payload.avatarUrl,
        "createdAt": datetime.utcnow().isoformat() + "Z",
    }
    return await user_repository.create_user(user_dict)


@router.patch("/{user_id}/role", response_model=UserModel)
async def update_role(user_id: str, payload: UserUpdateRole):
    """Update a user's role (admin/manager action)."""
    user = await user_repository.update_user_role(user_id, payload.role)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id '{user_id}' was not found.",
        )
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(user_id: str):
    """Delete a user from the workspace."""
    success = await user_repository.delete_user(user_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id '{user_id}' was not found.",
        )
    return None

