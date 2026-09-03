from typing import Optional, Literal
from pydantic import BaseModel, EmailStr, Field

UserRole = Literal["team_member", "manager", "admin"]


class UserModel(BaseModel):
    id: str
    name: str
    email: str
    role: UserRole = "team_member"
    title: str = "Software Engineer"
    department: str = "Engineering"
    avatarUrl: Optional[str] = None
    createdAt: Optional[str] = None

    class Config:
        populate_by_name = True


class UserCreate(BaseModel):
    name: str
    email: str
    role: UserRole = "team_member"
    title: Optional[str] = "Software Engineer"
    department: Optional[str] = "Engineering"
    avatarUrl: Optional[str] = None


class UserUpdateRole(BaseModel):
    role: UserRole


class LoginRequest(BaseModel):
    email: str
    role: Optional[UserRole] = None

