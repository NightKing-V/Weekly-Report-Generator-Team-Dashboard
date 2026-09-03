from typing import Optional, Literal
from pydantic import BaseModel

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


class UserInDB(UserModel):
    hashedPassword: Optional[str] = None


class UserCreate(BaseModel):
    name: str
    email: str
    password: Optional[str] = "password123"
    role: UserRole = "team_member"
    title: Optional[str] = "Software Engineer"
    department: Optional[str] = "Engineering"
    avatarUrl: Optional[str] = None


class UserRegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    role: UserRole = "team_member"
    title: Optional[str] = "Software Engineer"
    department: Optional[str] = "Engineering"
    avatarUrl: Optional[str] = None


class UserUpdateRole(BaseModel):
    role: UserRole


class LoginRequest(BaseModel):
    email: str
    password: Optional[str] = "password123"
    role: Optional[UserRole] = None


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserModel
