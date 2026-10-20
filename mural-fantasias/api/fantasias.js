import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
let ready = false;

// Cria a tabela na primeira chamada (não precisa rodar SQL no Neon)
async function setup() {
  if (ready) return;
  await sql`
    CREATE TABLE IF NOT EXISTS fantasias (
      chave      TEXT PRIMARY KEY,
      fantasia   TEXT NOT NULL,
      dono       TEXT NOT NULL,
      criado_em  TIMESTAMPTZ NOT NULL DEFAULT now()
    )`;
  ready = true;
}

// "O Vampiro!" e "vampiro" viram a mesma chave
function chaveDe(texto) {
  let s = String(texto || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
  s = s.replace(/^(o|a|os|as|um|uma|the)\s+/, "");
  s = s.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return s.slice(0, 120);
}

function dono(valor) {
  const t = String(valor || "");
  return /^[A-Za-z0-9-]{16,64}$/.test(t) ? t : null;
}

async function lista() {
  return sql`SELECT chave, fantasia, dono, criado_em FROM fantasias ORDER BY criado_em ASC`;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  try {
    await setup();

    if (req.method === "GET") {
      const t = dono(req.query.dono);
      const rows = await lista();
      // nunca devolve o código de dono dos outros
      return res.status(200).json(rows.map((r) => ({
        chave: r.chave, fantasia: r.fantasia, minha: t !== null && r.dono === t,
      })));
    }

    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const t = dono(body.dono);
    if (!t) return res.status(400).json({ erro: "Recarregue a página e tente de novo." });

    if (req.method === "POST") {
      const fantasia = String(body.fantasia || "").trim().replace(/\s+/g, " ").slice(0, 60);
      const chave = chaveDe(fantasia);
      if (!chave) return res.status(400).json({ erro: "Escreva qual é a fantasia." });

      const inserida = await sql`
        INSERT INTO fantasias (chave, fantasia, dono) VALUES (${chave}, ${fantasia}, ${t})
        ON CONFLICT (chave) DO NOTHING RETURNING chave`;

      if (inserida.length === 0) {
        const [atual] = await sql`SELECT fantasia, dono FROM fantasias WHERE chave = ${chave}`;
        if (atual && atual.dono !== t) {
          return res.status(409).json({ erro: `"${atual.fantasia}" já foi escolhida. Escolha outra.` });
        }
      }
      // cada pessoa fica com uma fantasia só: libera a anterior
      await sql`DELETE FROM fantasias WHERE dono = ${t} AND chave <> ${chave}`;
      return res.status(200).json({ ok: true, fantasia });
    }

    if (req.method === "DELETE") {
      await sql`DELETE FROM fantasias WHERE dono = ${t}`;
      return res.status(200).json({ ok: true });
    }

    res.setHeader("Allow", "GET, POST, DELETE");
    return res.status(405).json({ erro: "Método não permitido." });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ erro: "Não deu para falar com o banco agora. Tente de novo em instantes." });
  }
}
