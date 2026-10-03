<<<<<<< HEAD
## Enterprise AI-CRM Platform

A Spring Boot REST backend for customer lifecycle management, rule-based audience segmentation, and asynchronous campaign delivery, with AI-assisted rule generation.

### The problem it solves

Many businesses keep customer data in spreadsheets. Reaching "customers who spent over 1000" means filtering by hand, pasting a list into an email tool, sending to everyone, and never seeing who actually received the message. That is slow, error-prone, and needs a technical person for anything beyond simple filters.

This platform turns that into one pipeline:

- **Import** customer data in bulk (CSV/XLSX) instead of retyping it.
- **Segment** customers with saved rules, or describe the audience in plain English and let AI write the rule.
- **Preview** the matching audience before sending, so a wrong rule doesn't message the wrong people.
- **Deliver asynchronously** through a queue, so large campaigns don't block the app and one failed message doesn't stop the rest.
- **Track** exactly how many messages were sent, pending or failed.
- **Control access** so marketers can run campaigns but cannot manage users.

### Tech stack

| Layer | Technology |
|---|---|
| Language / framework | Java 21, Spring Boot 3.3.3, Maven |
| Database | MySQL 8.x (Spring Data JPA / Hibernate) |
| Queue | Redis Streams (campaign delivery outbox and workers) |
| Security | Spring Security, JWT bearer tokens, role-based access |
| AI | Google Gemini (segment rule translation, campaign summaries) |
| API docs | Springdoc OpenAPI / Swagger UI |

### Actors and roles

| Actor | Role | Can do |
|---|---|---|
| Admin | `ROLE_ADMIN` | Everything, including user management (create users, change roles, reset passwords, deactivate) |
| Marketer | `ROLE_MARKETER` | Customers, segments and campaigns. Cannot access user management (`/api/v1/users` returns 403) |
| Customer | none (data only) | Does not log in. Customers are records that segments target and campaigns message |

**Demo accounts (local development only, change before any real deployment):**

| Username | Password | Role |
|---|---|---|
| `admin` | `Admin@123` | `ROLE_ADMIN` |
| `marketer2` | `NewPass@123` | `ROLE_MARKETER` |

Passwords are stored as bcrypt hashes in the `users` table.

### System flow

1. **Login.** `POST /api/v1/auth/login` returns a JWT. Every later request sends it as `Authorization: Bearer <token>`. The role in the token decides what the caller may do.
2. **User management (admin).** The admin creates marketer accounts, and can change roles, reset passwords or deactivate users.
3. **Customer data in.** Customers are created individually or uploaded in bulk (`POST /api/v1/uploads/bulk`). Each upload is validated row by row and logged in upload history with total, successful and failed record counts.
4. **Segmentation.** A segment is a saved rule such as `totalSpend GREATER_THAN 1000`. Rules can be nested with boolean logic. A marketer can instead describe the audience in English, and Gemini translates it into a rule. Each AI request is stored in an audit table.
5. **Preview.** `POST /api/v1/segments/{id}/preview` returns how many customers match before anything is sent.
6. **Campaign.** A campaign combines a message template with a segment.
7. **Launch.** `POST /api/v1/campaigns/{id}/launch` queues one delivery per matching customer on a Redis Stream. Background workers consume the stream and send through the configured delivery provider. Each result is recorded per customer.
8. **Tracking and reports.** The delivery summary shows target audience size, sent, failed, pending and completion percentage. Reports cover a customer overview, per-campaign results and campaign history.

```
Login (JWT) -> Import customers -> Build segment (rules or AI)
   -> Preview audience -> Create campaign -> Launch
   -> Redis Stream -> Delivery workers -> Delivery records
   -> Delivery summary and reports
```

### API overview

Base URL: `http://localhost:8081/api/v1`. Full interactive docs: `http://localhost:8081/swagger-ui/index.html`.

| Area | Endpoints |
|---|---|
| Auth | `POST /auth/login` |
| Users (admin) | `GET/POST /users`, `GET /users/{id}`, `PATCH /users/{id}/role`, `PATCH /users/{id}/password`, `PATCH /users/{id}/deactivate` |
| Customers | `GET/POST /customers`, `GET/PATCH/DELETE /customers/{id}`, `GET /customers/count` |
| Uploads | `POST /uploads/bulk`, `GET /uploads/history` |
| Segments | `GET/POST /segments`, `GET/PATCH/DELETE /segments/{id}`, `GET /segments/{id}/members`, `POST /segments/{id}/preview` |
| Campaigns | `GET/POST /campaigns`, `GET/PATCH/DELETE /campaigns/{id}`, `POST /campaigns/{id}/launch` |
| Delivery | `GET /campaigns/{id}/delivery-summary`, `GET /campaigns/{id}/deliveries` |
| AI | `POST /ai/segments/generate-rules`, `GET /ai/segments/audits` |
| Reports | `GET /reports/customers/overview`, `GET /reports/campaigns/{id}`, `GET /reports/campaigns/{id}/ai-summary`, `GET /reports/campaigns/history` |

### Running locally

**Prerequisites:** Java 21, Maven, MySQL 8.x running locally, Redis running locally, and a Gemini API key for the AI features.

1. Create the MySQL database and set the DB credentials, Redis host and Gemini key in `src/main/resources/application.yml`.
2. From the project root, run:
   ```
   mvn spring-boot:run
   ```
3. The app starts on port 8081. On first startup, if the users table is empty, an initial admin account is created.
4. Open Swagger UI, or log in with any HTTP client:
   ```powershell
   $response = Invoke-RestMethod -Uri "http://localhost:8081/api/v1/auth/login" -Method POST `
     -ContentType "application/json" -Body '{"username":"admin","password":"Admin@123"}'
   $token = $response.data.token
   ```

**Bulk upload format.** CSV with the header row `firstName,lastName,email,phone,totalSpend`. Save the file as plain ASCII or UTF-8 without BOM. A BOM makes the first header unreadable and the upload fails with "Missing required header(s): firstName".

### Testing performed

A manual API test run against the running application covered login, customer CRUD and search, segment create, update, preview, members and delete, campaign create, launch and delete, delivery records and summary, all customer and campaign reports, user create, role change, password change and deactivate, bulk CSV upload (2 of 2 records imported), and AI rule generation with audit history.

Role-based access was verified: a marketer receives 403 on the users endpoint and 200 on customers and campaigns.

A launched campaign (2 targeted customers) completed with 2 sent, 0 failed, 100% completion.

### Known limitations

- **Delivery is simulated.** The active provider is `SimulatedDeliveryProvider`, so no real emails or SMS are sent. A real provider (SMTP, SMS gateway) can be plugged in behind the same delivery interface.
- **AI campaign summary.** `GET /reports/campaigns/{id}/ai-summary` currently returns 503 in the local setup, most likely a Gemini configuration issue (key, quota or model name). Segment rule generation works.
- **Launched campaigns are immutable.** Editing a campaign after launch returns 409 by design.
- **Marketer permissions** were verified for customers, campaigns and the users restriction. Access to segments, uploads, reports and AI endpoints for the marketer role was not individually tested.
- **No frontend yet.** The backend is exercised through Swagger UI and HTTP clients.
=======
# enterprise-ai-crm-main
A Spring Boot REST backend for customer lifecycle management, rule-based audience segmentation, and asynchronous campaign delivery, with AI-assisted rule generation. 
>>>>>>> 1d99d34d4f9611ffed1851445682340c03b44b5d
