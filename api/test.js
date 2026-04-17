export default async function handler(req, res) {
  res.status(200).json({ status: "ok", env: !!process.env.DATABASE_URL });
}
