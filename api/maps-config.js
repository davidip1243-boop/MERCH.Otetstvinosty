module.exports = function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Only GET is allowed." });
  return res.status(200).json({ apiKey: process.env.YANDEX_MAPS_API_KEY || "" });
};
