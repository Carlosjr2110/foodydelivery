# Foody Delivery — Sistema de rastreamento de pedidos

Sistema de gestão e rastreamento de pedidos de delivery: cadastro de clientes e
entregadores, criação de pedidos, acompanhamento do status em tempo real (Recebido →
Em preparo → Saiu para entrega → Entregue/Cancelado) e um painel de análise de SLA.

- **Backend**: Java 21 + Spring Boot 3 (REST API + Spring Security com JWT + JPA/Hibernate)
- **Banco de dados**: SQLite (um único arquivo, sem servidor de banco separado)
- **Frontend**: React 19 + Vite

---

## Como rodar (modo simples, com Docker)

Pré-requisito: **Docker** e **Docker Compose** instalados ([Docker Desktop](https://www.docker.com/products/docker-desktop/)
no Windows/Mac já vem com os dois).

Na pasta raiz do projeto (onde fica este README), rode:

```bash
docker compose up --build
```

Isso vai:
1. Compilar o backend (Java/Maven) dentro de um container e subir a API.
2. Compilar o frontend (Vite) e servir os arquivos estáticos com Nginx.

Quando terminar de subir, acesse:

- **Aplicação (frontend)**: http://localhost:5173
- **API (backend)**: http://localhost:8080/api

Crie uma conta pela tela de cadastro (`/register`) e comece a usar — não existe
usuário pré-criado.

Para parar:

```bash
docker compose down
```

Os dados ficam salvos num volume Docker (`backend-data`) mesmo depois de parar. Se
quiser **apagar tudo e começar do zero**:

```bash
docker compose down -v
```

### Rodar em segundo plano

```bash
docker compose up --build -d
```

Para ver os logs depois:

```bash
docker compose logs -f
```

### Reconstruir depois de alterar o código

```bash
docker compose up --build
```

(o Docker reaproveita o cache de dependências — só reinstala/recompila o que mudou)

---

## Como rodar sem Docker (modo manual, para desenvolvimento)

Pré-requisitos:
- **Java 21** e **Maven** (ou use o wrapper, se o projeto tiver um)
- **Node.js 20+** e **npm**

### 1. Backend

```bash
cd backend
mvn spring-boot:run
```

A API sobe em `http://localhost:8080`. Um arquivo `delivery.db` (SQLite) é criado
automaticamente na pasta `backend/` na primeira execução — não precisa configurar
nenhum banco de dados externo.

### 2. Frontend

Em outro terminal:

```bash
cd frontend
npm install
npm run dev
```

O frontend sobe em `http://localhost:5173` (endereço padrão do Vite) e já aponta
para a API em `http://localhost:8080/api`.

> As duas partes precisam estar rodando ao mesmo tempo (backend e frontend), em
> terminais separados.

---

## Configuração (variáveis de ambiente)

O backend lê a configuração de `backend/src/main/resources/application.properties`,
mas os valores abaixo podem ser sobrescritos por variáveis de ambiente (é o que o
`docker-compose.yml` já faz):

| Variável | Para que serve | Padrão |
|---|---|---|
| `SPRING_DATASOURCE_URL` | Caminho do arquivo do banco SQLite | `jdbc:sqlite:delivery.db` |
| `APP_JWT_SECRET` | Chave usada para assinar os tokens JWT de login | valor de exemplo fixo no código |
| `APP_JWT_EXPIRATION_MS` | Validade do token de login, em milissegundos | `86400000` (24h) |
| `TZ` | Fuso horário usado pelo container (afeta os horários gravados nos pedidos) | `America/Sao_Paulo` |

⚠️ **Importante**: a chave JWT padrão é só um valor de exemplo para rodar local.
Se algum dia isso for exposto fora da sua máquina, troque `APP_JWT_SECRET` por um
valor próprio e secreto (o `docker-compose.yml` já tem o campo pronto para editar).

🕐 **Fuso horário**: rodando sem Docker, o backend usa o fuso do próprio sistema
operacional (por isso os horários batem certo). Dentro do container, a imagem
base do Java usa UTC por padrão — por isso o `Dockerfile`/`docker-compose.yml`
fixam `TZ=America/Sao_Paulo`. Se você estiver em outro fuso, troque esse valor.

---

## Estrutura do projeto

```
delivery/
├── backend/          # API Spring Boot (Java 21)
│   ├── src/
│   ├── pom.xml
│   └── Dockerfile
├── frontend/          # SPA React (Vite)
│   ├── src/
│   ├── package.json
│   ├── Dockerfile
│   └── nginx.conf     # serve o build do frontend em produção
└── docker-compose.yml # sobe backend + frontend juntos
```

---

## Solução de problemas

**"port is already allocated" ao subir com Docker**
Alguma coisa já está usando a porta 8080 ou 5173 na sua máquina (ex.: o backend
rodando manualmente ao mesmo tempo). Pare o processo que está usando a porta, ou
edite as portas do lado esquerdo em `docker-compose.yml` (ex.: `"5174:80"`).

**Perdi meus dados depois de um `docker compose down`**
Isso só acontece com `docker compose down -v` (o `-v` remove os volumes, incluindo
o banco). Sem o `-v`, os dados continuam no volume `backend-data`.

**Quero ver o conteúdo do banco SQLite**
Com Docker: `docker compose exec backend sh` e o arquivo está em `/app/data/delivery.db`.
Sem Docker: o arquivo `delivery.db` fica direto na pasta `backend/`.
