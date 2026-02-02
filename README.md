# PC Parts E-Commerce

A full-stack e-commerce website for PC components built with **Spring Boot** (backend) and **React/Vite** (frontend).

## Quickstart

1. **Set up your PostgreSQL database.**
2. **Run backend Spring Boot (Java 17 + Maven).**
3. **Start frontend React/Vite (Node 18+).**

## Requirements

- **PostgreSQL** database server
- **Java 17** and **Maven 3.8+** for backend
- **Node.js 18+** and **npm** (or pnpm/yarn) for frontend

## 1. Database Setup

Create a PostgreSQL database and configure your connection details.

### Configuration via Environment Variables

You can configure the database connection using environment variables:

```bash
export SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/pc_shop_database
export SPRING_DATASOURCE_USERNAME=your_username
export SPRING_DATASOURCE_PASSWORD=your_password
```

Or create a `.env` file (see `.env.example`).

Sample connection via `psql`:

```bash
psql -h localhost -p 5432 -U your_username -d pc_shop_database
```

## 2. Backend

Build and run Spring Boot service using Maven:

```bash
cd backend
mvn spring-boot:run
```

- Backend runs at `http://localhost:8080` by default.
- Modify connection config in `src/main/resources/application.yml` if needed.

## 3. Frontend

Install dependencies and start Vite dev server:

```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
```

- Frontend runs at `http://localhost:5173` by default.
- Configure backend URL via `VITE_API_BASE_URL` environment variable.

## 4. Test Accounts

After seeding the database, you can use these accounts:

```
ROLE ADMIN
username: admin
password: (set in your database)

ROLE STAFF
username: staff
password: (set in your database)

ROLE CUSTOMER
username: customer
password: (set in your database)
```

## 5. Docker Compose Deployment

Use Docker to build and run frontend + backend together.

### Container Structure

- **backend**: Spring Boot 3 (Java 17). Dockerfile uses multi-stage Maven build.
- **frontend**: React/Vite built and served by Nginx.
- **docker-compose.yml** combines both services.

### Environment Variables

Create a `.env` file at the project root:

```bash
SPRING_DATASOURCE_URL=jdbc:postgresql://your-db-host:5432/your_database
SPRING_DATASOURCE_USERNAME=your_username
SPRING_DATASOURCE_PASSWORD=your_password
VITE_API_BASE_URL=http://localhost:8080/api/v1
VITE_GEMINI_API_KEY=your_gemini_api_key  # Optional: for AI advisor feature
```

### Build & Run

```bash
# From project root
docker compose up -d --build

# View logs
docker compose logs -f backend
docker compose logs -f frontend
```

## Project Structure

```
├── backend/           # Spring Boot Java backend
├── frontend/          # React/Vite TypeScript frontend
├── pc-part-dataset/   # Sample product data (CSV/JSON)
├── scripts/           # Utility scripts
├── docker-compose.yml # Docker orchestration
└── database_schema.sql # Database schema
```

## Tech Stack

### Backend

- Java 17
- Spring Boot 3
- Spring Security + JWT
- PostgreSQL
- Hibernate/JPA

### Frontend

- React 18
- TypeScript
- Vite
- Material UI
- Redux Toolkit

## License

MIT License
