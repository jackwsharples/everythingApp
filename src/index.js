import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "";

app.use(cors());
app.use(express.json());
app.use(express.static("web"));

function requireAdmin(req, res, next) {
  const tok = (req.headers.authorization || "").replace("Bearer ","");
  if (!ADMIN_TOKEN || tok === ADMIN_TOKEN) return next();
  res.status(401).json({ error: "unauthorized" });
}

app.get("/api/items", async (req, res) => {
  const { type, tag, q, from, to, limit = 100, sort = "updatedAt:desc" } = req.query;
  const [field, dir] = String(sort).split(":");
  const where = {
    AND: [
      type ? { type: String(type) } : {},
      tag ? { tags: { has: String(tag) } } : {},
      q ? { OR: [
        { title: { contains: String(q), mode: "insensitive" } },
        { data:  { path: [], string_contains: String(q) } } // works on PG json with Prisma 5 text search
      ] } : {},
      from || to ? { when: {
        gte: from ? new Date(String(from)) : undefined,
        lte: to   ? new Date(String(to))   : undefined,
      }} : {}
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
  const created = await prisma.item.create({ data: { type, title, data, tags, when } });
  res.json(created);
});

app.patch("/api/items/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { title, data, tags, when } = req.body;
  const updated = await prisma.item.update({
    where: { id },
    data: {
      title: title ?? undefined,
      data:  data  ?? undefined,
      tags:  Array.isArray(tags) ? tags : undefined,
      when:  when !== undefined ? (when ? new Date(when) : null) : undefined
    }
  });
  res.json(updated);
});

app.delete("/api/items/:id", requireAdmin, async (req, res) => {
  await prisma.item.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

app.listen(PORT, () => console.log(`API on :${PORT}`));
