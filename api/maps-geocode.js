module.exports = async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Only GET is allowed." });
  const { lat, lon, q } = req.query || {};
  const latitude = Number(lat);
  const longitude = Number(lon);
  const query = typeof q === "string" ? q.trim() : `${longitude},${latitude}`;
  if (!query || (!q && (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180))) return res.status(400).json({ error: "A valid location is required." });
  if (!process.env.YANDEX_MAPS_API_KEY) return res.status(503).json({ error: "Map key is not configured." });

  const params = new URLSearchParams({ apikey: process.env.YANDEX_MAPS_API_KEY, geocode: query, format: "json", lang: "ru_RU", results: "10" });
  const response = await fetch(`https://geocode-maps.yandex.ru/v1/?${params}`);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) return res.status(502).json({ error: "Yandex address lookup failed." });

  const members = payload?.response?.GeoObjectCollection?.featureMember || [];
  const objects = members.map((member) => member?.GeoObject).filter(Boolean);
  const object = objects.find((candidate) => {
    const meta = candidate?.metaDataProperty?.GeocoderMetaData;
    return meta?.kind === "house" || /\b\d{1,5}[а-яa-z]?\b/iu.test(meta?.text || "");
  }) || objects.find((candidate) => candidate?.metaDataProperty?.GeocoderMetaData?.text);
  if (!object) return res.status(404).json({ error: "No address found for this location." });

  const meta = object.metaDataProperty?.GeocoderMetaData || {};
  const position = String(object.Point?.pos || "").trim().split(/\s+/).map(Number);
  return res.status(200).json({ address: meta.text || "", kind: meta.kind || "", precision: meta.precision || "", longitude: position[0], latitude: position[1] });
};
