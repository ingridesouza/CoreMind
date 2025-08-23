# Monorepo Boilerplate

## Pré-requisitos
- Docker
- Docker Compose

## Passos
1. Copie `.env.example` para `.env` e ajuste se necessário.
2. Execute `make up` para subir os serviços.

Backend: http://localhost:8000/api/health/ e docs em http://localhost:8000/api/docs/

Frontend: http://localhost:5173

Criar admin: `make createsuperuser`

Login JWT: POST `/api/users/token/` → `{access, refresh}`; usar `Authorization: Bearer <access>`
