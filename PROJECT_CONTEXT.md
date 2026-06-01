# CommuteVibe Backend — Complete Specification
> **For GitHub Copilot:** This document is the single source of truth for the entire backend.
> Read every section before generating any code. Business logic is as important as structure.

---

## 1. Project Overview

CommuteVibe is a mobility intelligence app for Indian commuters.
Users set GPS-based alarms, plan multi-leg transit routes, and report crowd levels in real time.
The backend serves the Flutter Android app and also **silently collects anonymized mobility data**
for future FMCG consumer intelligence use cases.

---

## 2. Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Framework | NestJS (TypeScript, strict mode) | Modular architecture |
| Database | PostgreSQL via Docker | Local dev |
| ORM | Prisma 7 | Config via `prisma.config.ts` |
| Auth | Firebase Auth (identity) + Custom JWT (session) | Firebase verifies, we issue JWT |
| Real-time | Socket.io via `@nestjs/websockets` | Crowd reports broadcast |
| AI | Google Gemini API (`@google/generative-ai`) | Route suggestions |
| Validation | `class-validator` + `class-transformer` | Global validation pipe |
| Config | `@nestjs/config` + `.env` | Global config module |
| Maps | OLA Maps SDK (Flutter side) — backend stores coordinates only | |

---

## 3. Environment Variables (`.env`)

```env
DATABASE_URL="postgresql://postgres:commutevibe123@localhost:5432/commutevibe"
JWT_SECRET="commutevibe-super-secret-jwt-2024"
JWT_EXPIRES_IN="7d"
FIREBASE_PROJECT_ID="your-firebase-project-id"
FIREBASE_CLIENT_EMAIL="your-firebase-client-email"
FIREBASE_PRIVATE_KEY="your-firebase-private-key"
GEMINI_API_KEY="your-gemini-api-key"
PORT=3000
```

---

## 4. Prisma Schema (`prisma/schema.prisma`)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
}

model User {
  id          String   @id @default(uuid())
  firebaseUid String   @unique @map("firebase_uid")
  name        String
  email       String   @unique
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  alarm        Alarm?
  crowdReports CrowdReport[]
  routes       Route[]

  @@map("users")
}

model Alarm {
  id           String   @id @default(uuid())
  userId       String   @unique @map("user_id")
  label        String
  destLat      Float    @map("dest_lat")
  destLng      Float    @map("dest_lng")
  radiusMeters Int      @default(300) @map("radius_meters")
  isActive     Boolean  @default(true) @map("is_active")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("alarms")
}

model CrowdReport {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  lat       Float
  lng       Float
  level     Int      // 1 = LOW, 2 = MEDIUM, 3 = HIGH
  createdAt DateTime @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([lat, lng])
  @@index([createdAt])
  @@map("crowd_reports")
}

model Route {
  id          String   @id @default(uuid())
  userId      String   @map("user_id")
  originLat   Float    @map("origin_lat")
  originLng   Float    @map("origin_lng")
  destLat     Float    @map("dest_lat")
  destLng     Float    @map("dest_lng")
  legs        Json     @default("[]")
  transitMode String   @map("transit_mode")
  durationMin Int      @map("duration_min")
  chosenByAi  Boolean  @default(false) @map("chosen_by_ai")
  createdAt   DateTime @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([createdAt])
  @@map("routes")
}
```

### Legs JSON Structure (for Route model)
```json
[
  {
    "mode": "BRTS",
    "fromLabel": "Adajan",
    "toLLabel": "Ranip",
    "fromLat": 21.1702,
    "fromLng": 72.8311,
    "toLat": 23.0395,
    "toLng": 72.5713,
    "durationMin": 25
  },
  {
    "mode": "METRO",
    "fromLabel": "Ranip",
    "toLabel": "Motera Stadium",
    "fromLat": 23.0395,
    "fromLng": 72.5713,
    "toLat": 23.0947,
    "toLng": 72.5944,
    "durationMin": 12
  }
]
```

---

## 5. Prisma Config (`prisma.config.ts`)

```typescript
import path from 'node:path'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  earlyAccess: true,
  schema: path.join('prisma', 'schema.prisma'),
  migrate: {
    async adapter() {
      const { PrismaPg } = await import('@prisma/adapter-pg')
      const connectionString = process.env.DATABASE_URL!
      return new PrismaPg({ connectionString })
    },
  },
})
```

---

## 6. Folder Structure

```
src/
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── dto/
│   │   └── firebase-auth.dto.ts
│   └── guards/
│       └── jwt.guard.ts
├── alarms/
│   ├── alarms.module.ts
│   ├── alarms.controller.ts
│   ├── alarms.service.ts
│   └── dto/
│       ├── create-alarm.dto.ts
│       └── update-alarm.dto.ts
├── crowd/
│   ├── crowd.module.ts
│   ├── crowd.controller.ts
│   ├── crowd.service.ts
│   ├── crowd.gateway.ts         ← Socket.io gateway
│   └── dto/
│       └── create-crowd-report.dto.ts
├── routes/
│   ├── routes.module.ts
│   ├── routes.controller.ts
│   ├── routes.service.ts
│   └── dto/
│       └── create-route.dto.ts
├── ai/
│   ├── ai.module.ts
│   └── ai.service.ts            ← Gemini integration
├── prisma/
│   ├── prisma.module.ts
│   └── prisma.service.ts
├── common/
│   ├── decorators/
│   │   └── current-user.decorator.ts
│   └── interfaces/
│       └── jwt-payload.interface.ts
├── app.module.ts
└── main.ts
```

---

## 7. Main Entry (`src/main.ts`)

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  app.enableCors();

  await app.listen(process.env.PORT ?? 3000);
  console.log(`CommuteVibe backend running on port ${process.env.PORT ?? 3000}`);
}
bootstrap();
```

---

## 8. App Module (`src/app.module.ts`)

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AlarmsModule } from './alarms/alarms.module';
import { CrowdModule } from './crowd/crowd.module';
import { RoutesModule } from './routes/routes.module';
import { AiModule } from './ai/ai.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    AlarmsModule,
    CrowdModule,
    RoutesModule,
    AiModule,
  ],
})
export class AppModule {}
```

---

## 9. Prisma Module & Service

### `src/prisma/prisma.module.ts`
- Decorated with `@Global()` — available everywhere without re-importing
- Provides and exports `PrismaService`

### `src/prisma/prisma.service.ts`
- Extends `PrismaClient`
- Constructor creates `PrismaPg` adapter using `process.env.DATABASE_URL`
- Implements `OnModuleInit` → calls `this.$connect()`
- Implements `OnModuleDestroy` → calls `this.$disconnect()`

---

## 10. Auth Module

### Flow
```
Flutter sends Firebase ID Token
  → POST /api/v1/auth/login
    → Backend verifies token with Firebase Admin SDK
      → Finds or creates User in DB (upsert by firebaseUid)
        → Issues our own JWT containing { sub: userId, email }
          → Flutter stores JWT in SharedPreferences
            → All subsequent requests send JWT in Authorization: Bearer header
```

### `src/auth/dto/firebase-auth.dto.ts`
```typescript
import { IsString, IsNotEmpty } from 'class-validator';

export class FirebaseAuthDto {
  @IsString()
  @IsNotEmpty()
  idToken: string; // Firebase ID token from Flutter
}
```

### `src/auth/guards/jwt.guard.ts`
- Extends `AuthGuard('jwt')` from `@nestjs/passport`
- Used as `@UseGuards(JwtGuard)` on protected routes
- On validation failure returns 401 Unauthorized

### `src/common/interfaces/jwt-payload.interface.ts`
```typescript
export interface JwtPayload {
  sub: string;   // our DB user id (uuid)
  email: string;
}
```

### `src/common/decorators/current-user.decorator.ts`
- Custom param decorator `@CurrentUser()`
- Extracts `req.user` from request (set by JWT strategy)
- Returns the full User object from DB

### `src/auth/auth.service.ts` — Business Logic
```
verifyFirebaseToken(idToken: string):
  → Use firebase-admin to verify the ID token
  → Extract uid, email, name from decoded token
  → Upsert user in DB:
      - If firebaseUid exists → return existing user
      - If not → create new user with name, email, firebaseUid
  → Generate JWT using JwtService.sign({ sub: user.id, email: user.email })
  → Return { accessToken, user }
```

### `src/auth/auth.controller.ts` — Endpoints

#### `POST /api/v1/auth/login`
- **Body:** `FirebaseAuthDto { idToken: string }`
- **Auth:** None (public)
- **Logic:** Calls `authService.verifyFirebaseToken(idToken)`
- **Response:**
```json
{
  "accessToken": "eyJhbGc...",
  "user": {
    "id": "uuid",
    "name": "Pratham",
    "email": "pratham@example.com"
  }
}
```

#### `GET /api/v1/auth/me`
- **Auth:** JwtGuard
- **Logic:** Returns current user from `@CurrentUser()`
- **Response:** Full user object without sensitive fields

### `src/auth/auth.module.ts`
- Imports `JwtModule.register({ secret: process.env.JWT_SECRET, signOptions: { expiresIn: process.env.JWT_EXPIRES_IN } })`
- Imports `PassportModule`
- Registers `JwtStrategy` as provider
- Firebase Admin SDK initialized here using `firebase-admin` with env credentials

---

## 11. Alarms Module

### Business Rules
- One alarm per user maximum at any time
- If user creates alarm and one already exists → **replace it** (upsert)
- Alarm has a destination coordinate and radius in meters
- `isActive: false` means alarm is set but paused
- Flutter handles the actual GPS tracking and local notification
- Backend stores and syncs alarm state

### `src/alarms/dto/create-alarm.dto.ts`
```typescript
import { IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';

export class CreateAlarmDto {
  @IsString()
  label: string; // "Motera Stadium"

  @IsNumber()
  destLat: number;

  @IsNumber()
  destLng: number;

  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(2000)
  radiusMeters?: number; // default 300
}
```

### `src/alarms/dto/update-alarm.dto.ts`
```typescript
import { IsBoolean, IsOptional, IsNumber, IsString, Min, Max } from 'class-validator';

export class UpdateAlarmDto {
  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsNumber()
  destLat?: number;

  @IsOptional()
  @IsNumber()
  destLng?: number;

  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(2000)
  radiusMeters?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
```

### `src/alarms/alarms.service.ts` — Business Logic

```
upsertAlarm(userId, dto):
  → prisma.alarm.upsert({
      where: { userId },
      create: { userId, ...dto },
      update: { ...dto, isActive: true }
    })
  → Return updated alarm

getAlarm(userId):
  → prisma.alarm.findUnique({ where: { userId } })
  → Return alarm or null

updateAlarm(userId, dto):
  → prisma.alarm.update({ where: { userId }, data: dto })
  → Return updated alarm

deleteAlarm(userId):
  → prisma.alarm.delete({ where: { userId } })
  → Return { success: true }
```

### `src/alarms/alarms.controller.ts` — Endpoints
All routes protected with `@UseGuards(JwtGuard)`

#### `POST /api/v1/alarms`
- **Body:** `CreateAlarmDto`
- **Logic:** `alarmsService.upsertAlarm(currentUser.id, dto)`
- **Response:** Created/updated alarm object

#### `GET /api/v1/alarms`
- **Logic:** `alarmsService.getAlarm(currentUser.id)`
- **Response:** Alarm object or `null`

#### `PATCH /api/v1/alarms`
- **Body:** `UpdateAlarmDto`
- **Logic:** `alarmsService.updateAlarm(currentUser.id, dto)`
- **Response:** Updated alarm object

#### `DELETE /api/v1/alarms`
- **Logic:** `alarmsService.deleteAlarm(currentUser.id)`
- **Response:** `{ success: true }`

---

## 12. Crowd Module

### Business Rules
- Users submit crowd level at their current coordinates
- Level: `1 = LOW`, `2 = MEDIUM`, `3 = HIGH`
- Reports expire after **30 minutes** — filter by `createdAt > now - 30min` at query level
- When a new report is submitted → **broadcast via Socket.io** to all connected clients
- Nearby reports = within ~500 meters (use bounding box approximation, not exact haversine, for performance)
- One user should not spam — **rate limit to 1 report per 5 minutes per user** (check last report timestamp)

### Coordinate Bounding Box Logic
```
To find reports within ~500m of (lat, lng):
  latDelta = 0.0045  (approx 500m in latitude degrees)
  lngDelta = 0.0055  (approx 500m in longitude degrees at India's latitude)

  WHERE lat BETWEEN (lat - latDelta) AND (lat + latDelta)
  AND   lng BETWEEN (lng - lngDelta) AND (lng + lngDelta)
  AND   createdAt > NOW() - INTERVAL '30 minutes'
```

### `src/crowd/dto/create-crowd-report.dto.ts`
```typescript
import { IsNumber, IsInt, Min, Max } from 'class-validator';

export class CreateCrowdReportDto {
  @IsNumber()
  lat: number;

  @IsNumber()
  lng: number;

  @IsInt()
  @Min(1)
  @Max(3)
  level: number; // 1 = LOW, 2 = MEDIUM, 3 = HIGH
}
```

### `src/crowd/crowd.service.ts` — Business Logic

```
createReport(userId, dto):
  → Check last report by this user:
      SELECT * FROM crowd_reports 
      WHERE user_id = userId 
      ORDER BY created_at DESC LIMIT 1
  → If last report exists AND createdAt > now - 5 minutes:
      throw TooManyRequestsException('Report too soon. Wait 5 minutes.')
  → Create new report
  → Return report

getNearbyReports(lat, lng):
  → Query with bounding box (see above)
  → Filter createdAt > now - 30 minutes  
  → Group by approximate area and return aggregated level
  → Response shape:
    [{ lat, lng, level, reportCount, lastUpdated }]

getAreaLevel(lat, lng):
  → Same bounding box query
  → Average the levels of all reports in area
  → Return: { level: 1|2|3, label: 'LOW'|'MEDIUM'|'HIGH', reportCount: number }
```

### `src/crowd/crowd.gateway.ts` — Socket.io Gateway

```typescript
// WebSocket gateway for real-time crowd updates
// Namespace: /crowd

@WebSocketGateway({ namespace: '/crowd', cors: { origin: '*' } })
export class CrowdGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Called from CrowdService after a new report is created
  broadcastNewReport(report: CrowdReport): void {
    // Emit to all connected clients
    this.server.emit('crowd:update', {
      lat: report.lat,
      lng: report.lng,
      level: report.level,
      createdAt: report.createdAt,
    });
  }
}
```

### `src/crowd/crowd.controller.ts` — Endpoints
All routes protected with `@UseGuards(JwtGuard)`

#### `POST /api/v1/crowd`
- **Body:** `CreateCrowdReportDto`
- **Logic:** 
  1. `crowdService.createReport(currentUser.id, dto)`
  2. `crowdGateway.broadcastNewReport(report)`
- **Response:** Created report

#### `GET /api/v1/crowd/nearby`
- **Query Params:** `lat: number`, `lng: number`
- **Logic:** `crowdService.getNearbyReports(lat, lng)`
- **Response:** Array of nearby crowd reports

#### `GET /api/v1/crowd/area-level`
- **Query Params:** `lat: number`, `lng: number`
- **Logic:** `crowdService.getAreaLevel(lat, lng)`
- **Response:**
```json
{
  "level": 2,
  "label": "MEDIUM",
  "reportCount": 7
}
```

---

## 13. Routes Module

### Business Rules
- Store every route a user navigates — this is training data for AI
- Multi-leg journeys stored as JSON array in `legs` field
- `chosenByAi: true` when the route was an AI suggestion the user accepted
- Route history used by AI service to learn user preferences
- Transit modes: `METRO`, `BRTS`, `RICKSHAW`, `RAPIDO`, `UBER`, `WALK`, `BUS`

### `src/routes/dto/create-route.dto.ts`
```typescript
import { IsNumber, IsString, IsBoolean, IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class LegDto {
  @IsString()
  mode: string; // METRO, BRTS, etc.

  @IsString()
  fromLabel: string;

  @IsString()
  toLabel: string;

  @IsNumber()
  fromLat: number;

  @IsNumber()
  fromLng: number;

  @IsNumber()
  toLat: number;

  @IsNumber()
  toLng: number;

  @IsNumber()
  durationMin: number;
}

export class CreateRouteDto {
  @IsNumber()
  originLat: number;

  @IsNumber()
  originLng: number;

  @IsNumber()
  destLat: number;

  @IsNumber()
  destLng: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LegDto)
  legs: LegDto[];

  @IsString()
  transitMode: string; // primary mode

  @IsNumber()
  durationMin: number; // total duration

  @IsOptional()
  @IsBoolean()
  chosenByAi?: boolean;
}
```

### `src/routes/routes.service.ts` — Business Logic

```
createRoute(userId, dto):
  → prisma.route.create({ data: { userId, ...dto } })
  → Return created route

getUserRoutes(userId, limit = 20):
  → prisma.route.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit
    })
  → Return routes array

getRouteHistory(userId):
  → Same as getUserRoutes but returns all
  → Used internally by AI service
```

### `src/routes/routes.controller.ts` — Endpoints
All routes protected with `@UseGuards(JwtGuard)`

#### `POST /api/v1/routes`
- **Body:** `CreateRouteDto`
- **Logic:** `routesService.createRoute(currentUser.id, dto)`
- **Response:** Created route

#### `GET /api/v1/routes`
- **Query Params:** `limit?: number` (default 20)
- **Logic:** `routesService.getUserRoutes(currentUser.id, limit)`
- **Response:** Array of routes

---

## 14. AI Module (Gemini)

### Purpose
Use Gemini to suggest the best commute route based on:
- User's origin and destination
- Current crowd reports near the route
- User's past route history (preferences)
- Time of day

### Dependencies
```bash
npm install @google/generative-ai
```

### `src/ai/ai.service.ts` — Business Logic

```
suggestRoute(userId, originLat, originLng, destLat, destLng):

  Step 1: Fetch user's last 10 routes from RoutesService
  Step 2: Fetch nearby crowd reports from CrowdService
  Step 3: Build a structured prompt for Gemini:

  PROMPT TEMPLATE:
  """
  You are a smart commute assistant for Indian cities.
  
  User wants to travel from (originLat, originLng) to (destLat, destLng).
  
  Current crowd conditions near the route:
  [crowd data here as structured text]
  
  User's past route preferences:
  [last 10 routes summarized]
  
  Suggest the best multi-leg route. Consider:
  - Avoiding crowded areas (level 3 = HIGH)
  - User's preferred transit modes from history
  - Typical Indian transit options: METRO, BRTS, RICKSHAW, RAPIDO, UBER, WALK
  - Time efficiency
  
  Respond ONLY with a valid JSON object in this exact format:
  {
    "summary": "Brief route description",
    "totalDurationMin": number,
    "primaryMode": "string",
    "legs": [
      {
        "mode": "string",
        "fromLabel": "string",
        "toLabel": "string",
        "fromLat": number,
        "fromLng": number,
        "toLat": number,
        "toLng": number,
        "durationMin": number,
        "reason": "Why this leg was chosen"
      }
    ],
    "crowdWarning": "string or null"
  }
  """

  Step 4: Call Gemini API with this prompt
  Step 5: Parse JSON from response (strip markdown fences if present)
  Step 6: Return parsed suggestion

suggestRoute error handling:
  → If Gemini fails or returns invalid JSON → throw ServiceUnavailableException
  → Always validate parsed JSON has required fields before returning
```

### `src/ai/ai.module.ts`
- Imports `RoutesModule` and `CrowdModule`
- Provides `AiService`
- Exports `AiService`

### AI Endpoint (add to routes controller or separate)

#### `POST /api/v1/ai/suggest-route`
- **Auth:** JwtGuard
- **Body:**
```typescript
{
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
}
```
- **Logic:** `aiService.suggestRoute(currentUser.id, ...coords)`
- **Response:** Gemini route suggestion object
- **On success:** Also save this route with `chosenByAi: true` when user accepts it

---

## 15. Common Utilities

### `src/common/decorators/current-user.decorator.ts`
```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user; // Set by JWT strategy
  },
);
```

### `src/common/interfaces/jwt-payload.interface.ts`
```typescript
export interface JwtPayload {
  sub: string;   // DB user UUID
  email: string;
  iat?: number;
  exp?: number;
}
```

---

## 16. Standard Response Shape

All endpoints return consistent responses:

**Success:**
```json
{
  "data": { },
  "message": "Success message"
}
```

**Error:**
```json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "Bad Request"
}
```

NestJS handles error shape automatically via built-in exception filters.

---

## 17. Complete API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/auth/login` | None | Exchange Firebase token for JWT |
| GET | `/api/v1/auth/me` | JWT | Get current user |
| POST | `/api/v1/alarms` | JWT | Create or replace alarm |
| GET | `/api/v1/alarms` | JWT | Get current alarm |
| PATCH | `/api/v1/alarms` | JWT | Update alarm fields |
| DELETE | `/api/v1/alarms` | JWT | Delete alarm |
| POST | `/api/v1/crowd` | JWT | Submit crowd report |
| GET | `/api/v1/crowd/nearby` | JWT | Get nearby crowd reports |
| GET | `/api/v1/crowd/area-level` | JWT | Get aggregated crowd level |
| POST | `/api/v1/routes` | JWT | Save a route |
| GET | `/api/v1/routes` | JWT | Get route history |
| POST | `/api/v1/ai/suggest-route` | JWT | Get AI route suggestion |

---

## 18. Socket.io Events

**Namespace:** `/crowd`

| Event | Direction | Payload | Description |
|---|---|---|---|
| `crowd:update` | Server → Client | `{ lat, lng, level, createdAt }` | New crowd report submitted |
| `connect` | Client → Server | None | Client connects |
| `disconnect` | Client → Server | None | Client disconnects |

Flutter client should:
1. Connect to `ws://YOUR_SERVER/crowd`
2. Listen for `crowd:update` events
3. Update map markers in real time

---

## 19. Package Installation Commands

```bash
# Core
npm install @nestjs/config @nestjs/jwt @nestjs/passport @nestjs/websockets @nestjs/platform-socket.io

# Auth
npm install passport passport-jwt firebase-admin
npm install -D @types/passport-jwt

# Prisma
npm install @prisma/adapter-pg pg
npm install -D @types/pg

# Validation
npm install class-validator class-transformer

# AI
npm install @google/generative-ai

# Socket.io
npm install socket.io
```

---

## 20. Firebase Admin Initialization

Initialize once in `AuthModule` using `firebase-admin`:

```typescript
import * as admin from 'firebase-admin';

// In AuthModule constructor or onModuleInit:
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

// To verify a token:
const decoded = await admin.auth().verifyIdToken(idToken);
// decoded.uid → firebaseUid
// decoded.email → email
// decoded.name → display name
```

---

## 21. Key Architectural Decisions & Why

| Decision | Reason |
|---|---|
| Firebase for identity, custom JWT for sessions | Play Store compliance + shows JWT knowledge |
| Bounding box over Haversine for crowd queries | Performance at scale, good enough for 500m radius |
| Crowd reports expire in 30 min at query level, not delete | Preserves data for CMI analytics |
| Route legs stored as JSON not separate table | Flexibility for varying leg counts, simpler queries |
| Single alarm per user via `@unique` on userId | Enforced at DB level, not just application level |
| `@Global()` on PrismaModule | Avoids repetitive imports across every feature module |
| Rate limit crowd reports at service level | Prevents spam without external rate limit middleware |
| `chosenByAi` flag on routes | Future ML training data — know which AI suggestions users accept |

---

## 22. CMI Data Layer (Silent Collection)

> **Note for future:** The following fields/patterns are already in the schema to support FMCG intelligence use cases without any schema changes.

- `CrowdReport.lat/lng` + `createdAt` → Footfall density heatmaps by time
- `Route.legs` JSON → Transit corridor popularity
- `Route.transitMode` → Modal split data (BRTS vs Metro vs Rickshaw)
- `Alarm.destLat/destLng` → Destination hotspots (where people actually go)
- All data is user-owned but **anonymized aggregates** can be sold to FMCGs

When building intelligence queries later:
```sql
-- Example: Busiest transit corridors 7-9am
SELECT transit_mode, COUNT(*) as trips, AVG(duration_min) as avg_duration
FROM routes
WHERE created_at::time BETWEEN '07:00' AND '09:00'
GROUP BY transit_mode
ORDER BY trips DESC;
```

---

## 23. Development Notes for Copilot

1. **Every controller method** must use `@UseGuards(JwtGuard)` except auth endpoints
2. **Every service** receives `PrismaService` via constructor injection
3. **Never expose** `firebaseUid` in API responses — internal field only
4. **Crowd reports** — always filter `isDeleted` is not applicable here, use time-based expiry
5. **AI service** — always wrap Gemini call in try/catch, never let it crash the server
6. **Socket.io gateway** — inject `CrowdGateway` into `CrowdController` to broadcast after save
7. **Legs field** — always validate it's a valid array before saving, use `IsArray()` decorator
8. **JWT Strategy** — must fetch full user from DB using `sub` from payload, attach to `req.user`
9. **All DTOs** go in feature-specific `dto/` folders, never inline in controllers
10. **Return types** — services return Prisma model types, controllers return them directly (NestJS serializes)