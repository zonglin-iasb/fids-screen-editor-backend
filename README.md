# fids-screen-editor-backend

POC backend for the FIDS screen editor — templates + assets API. Mongoose-backed, NestJS 10. Folds into dcmm-backend later as a module swap.

## Quick start

```bash
npm install
cp .env.example .env   # already provided; edit if your Mongo URI differs
npm run start:dev
```

Server listens on `http://localhost:3001` by default. Verify:

```bash
curl http://localhost:3001/health
```

Expected response: `{ "status": "ok", "db": { "state": "connected", ... }, ... }`.

## Mongo

Connects to local Docker Mongo via `MONGO_URI` (see `.env.example`). Default DB name is `screen-editor` so we don't collide with dcmm-backend's collections on the same instance.

## Roadmap (this repo)

- [x] Skeleton + Mongo connection + health probe
- [ ] Templates API — CRUD
- [ ] Templates API — status flip (draft ↔ published)
- [ ] Assets API — upload / list / get-bytes / patch / delete
- [ ] Renderer fetch endpoint — bundled `(template + assetUrlMap)` for the future renderer

## Asset bytes

For the POC, asset blobs live on disk under `UPLOADS_DIR` (default `./uploads/`, gitignored). The asset service goes through an `IStorageService` seam so the swap to GCS is one file when this folds into dcmm-backend.
