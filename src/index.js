import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";

const app = express();
const PORT = process.env.PORT || 3000;

const prisma = new PrismaClient();
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "";

// middleware
app.use(cors());
app.use(express.json());
app.use(express.static("web"));

// health check
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// auth helper
function requireAdmin(req, res, next) {
  const tok = (req.headers.authorization || "").replace("Bearer ", "");
  if (!ADMIN_TOKEN || tok === ADMIN_TOKEN) return next();
  res.status(401).json({ error: "unauthorized" });
}

// routes
app.get("/api/items", async (req, res) => {
  const { type, tag, q, from, to, limit = 100, sort = "updatedAt:desc" } = req.query;
  const [field, dir] = String(sort).split(":");

  const where = {
    AND: [
      type ? { type: String(type) } : {},
      tag ? { tags: { has: String(tag) } } : {},
      q ? {
        OR: [
          { title: { contains: String(q), mode: "insensitive" } },
          // NOTE: `string_contains` only works on JSON with PG 15+ + Prisma 5 preview feature.
          // Safe fallback is to only search `title` until you enable JSON text search.
        ]
      } : {},
      from || to ? {
        when: {
          gte: from ? new Date(String(from)) : undefined,
          lte: to   ? new Date(String(to))   : undefined,
        }
      } : {}
    ]
  };

  const items = await prisma.item.findMany({
    where,
    take: Number(limit),
    orderBy: { [field]: (dir === "asc" ? "asc" : "desc") }
  });

  res.json(items);
});

app.post("/api/items", requireAdmin, async (req, res) => {
  const { type, title, data = {}, tags = [], when = null } = req.body;

  const created = await prisma.item.create({
    data: {
      type,
      title,
      data,
      tags,
      when: when ? new Date(when) : null
    }
  });

  res.json(created);
});

app.patch("/api/items/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { type, title, data = {}, tags = [], when } = req.body;

  const updated = await prisma.item.update({
    where: { id },
    data: {
      type,
      title,
      data,
      tags,
      when: when ? new Date(when) : null
    }
  });

  res.json(updated);
});

app.delete("/api/items/:id", requireAdmin, async (req, res) => {
  await prisma.item.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

// start server
app.listen(PORT, () => {
  console.log(`everythingApp listening on port ${PORT}`);
});
