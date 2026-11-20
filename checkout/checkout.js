const draft = JSON.parse(localStorage.getItem("otv-checkout-draft-v1") || "null");
const fulfillmentMethod = draft?.fulfillmentMethod === "pickup" ? "pickup" : "delivery";
const views = { form: document.querySelector('[data-checkout-view="form"]'), review: document.querySelector('[data-checkout-view="review"]'), result: document.querySelector('[data-checkout-view="result"]') };
const progress = (step) => document.querySelectorAll("[data-progress-step]").forEach((node) => node.classList.toggle("is-active", Number(node.dataset.progressStep) <= step));
const show = (view) => Object.entries(views).forEach(([key, node]) => node.toggleAttribute("hidden", key !== view));
const error = (message = "") => { document.querySelector("[data-checkout-error]").textContent = message; };
const normalizePhone = (value) => { const raw = String(value || "").trim().replace(/[\s()\-]/g, ""); if (/^8\d{10}$/.test(raw)) return `+7${raw.slice(1)}`; if (/^7\d{10}$/.test(raw)) return `+${raw}`; if (/^\+7\d{10}$/.test(raw)) return raw; return ""; };
const validateCustomer = (data) => {
  const errors = [];
  if (!/^[\p{L}][\p{L}\s'’-]{1,79}$/u.test(data.name.trim())) errors.push("Введите имя буквами.");
  data.phone = normalizePhone(data.phone); if (!data.phone) errors.push("Введите российский номер телефона.");
  if (!/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@gmail\.com$/i.test(data.email) || data.email.includes("..")) errors.push("Введите действующий Gmail.");
  const address = data.address.trim(); if (fulfillmentMethod === "delivery" && (address.length < 10 || !/\p{L}{2,}/u.test(address) || !/\b\d{1,5}[а-яa-z]?\b/iu.test(address))) errors.push("Укажите город, улицу и номер дома.");
  return errors;
};

async function setupDeliveryMap() {
  if (fulfillmentMethod === "pickup") { document.querySelector("[data-map-field]")?.setAttribute("hidden", ""); return; }
  const status = document.querySelector("[data-map-status]");
  try {
    const config = await fetch("/api/maps-config").then((response) => response.json());
    if (!config.apiKey) throw new Error("Map key is not configured yet.");
    await new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `https://api-maps.yandex.ru/2.1/?apikey=${encodeURIComponent(config.apiKey)}&lang=ru_RU`;
      script.onload = resolve; script.onerror = reject; document.head.appendChild(script);
    });
    await new Promise((resolve) => window.ymaps.ready(resolve));
    const addressInput = document.querySelector('[name="address"]');
    const map = new window.ymaps.Map("delivery-map", { center: [55.75, 37.61], zoom: 9, controls: ["zoomControl"] });
    const mapField = document.querySelector("[data-map-field]");
    mapField.dataset.mapReady = "true";
    addressInput.dataset.houseConfirmed = "false";
    const marker = new window.ymaps.Placemark([55.75, 37.61], {}, { draggable: true });
    map.geoObjects.add(marker);
    const findAddress = async (query) => {
      const results = [];
      try { results.push(await window.ymaps.geocode(query, { kind: "house", results: 5 })); } catch {}
      try { results.push(await window.ymaps.geocode(query, { results: 10 })); } catch {}
      for (const result of results) {
        const objects = result?.geoObjects;
        if (!objects) continue;
        for (let index = 0; index < objects.getLength(); index += 1) {
          const object = objects.get(index);
          const kind = object?.properties?.get("metaDataProperty.GeocoderMetaData.kind");
          const address = object?.getAddressLine?.() || object?.properties?.get("text") || "";
          if (kind === "house" || /\b\d{1,5}[а-яa-z]?\b/iu.test(address)) return object;
        }
      }
      return null;
    };
    const setAddressFromCoords = async (coords) => {
      marker.geometry.setCoordinates(coords);
      status.textContent = "Определяем адрес…";
      try {
        const object = await findAddress(coords);
        const address = object?.getAddressLine?.() || object?.properties?.get("text") || "";
        if (!object || !address) { addressInput.dataset.houseConfirmed = "false"; status.textContent = "Адрес не найден по точке. Введите адрес вручную ниже."; return; }
        addressInput.value = address; addressInput.dataset.houseConfirmed = "true"; addressInput.setCustomValidity("");
        status.textContent = "Дом найден. Адрес выбран по точке на карте.";
      } catch { addressInput.dataset.houseConfirmed = "false"; status.textContent = "Не удалось определить адрес по точке. Введите адрес вручную ниже."; }
    };
    addressInput.addEventListener("input", () => { addressInput.dataset.houseConfirmed = "false"; addressInput.setCustomValidity(""); });
    addressInput.addEventListener("blur", async () => { if (!addressInput.value.trim()) return; const object = await findAddress(addressInput.value.trim()).catch(() => null); if (object) { marker.geometry.setCoordinates(object.geometry.getCoordinates()); addressInput.value = object.getAddressLine?.() || addressInput.value; addressInput.dataset.houseConfirmed = "true"; addressInput.setCustomValidity(""); status.textContent = "Адрес найден."; } else { addressInput.dataset.houseConfirmed = "false"; addressInput.setCustomValidity(""); status.textContent = "Проверьте город, улицу и номер дома."; } });
    map.events.add("click", (event) => setAddressFromCoords(event.get("coords")));
    marker.events.add("dragend", () => setAddressFromCoords(marker.geometry.getCoordinates()));
    document.querySelector("[data-locate-button]")?.addEventListener("click", () => {
      if (!navigator.geolocation) { status.textContent = "Геолокация недоступна. Выберите точку на карте."; return; }
      status.textContent = "Запрашиваем разрешение на геолокацию…";
      navigator.geolocation.getCurrentPosition(({ coords }) => { map.setCenter([coords.latitude, coords.longitude], 16); setAddressFromCoords([coords.latitude, coords.longitude]); }, () => { status.textContent = "Не удалось получить местоположение. Выберите точку на карте."; }, { enableHighAccuracy: true, timeout: 10000 });
    });
  } catch (mapError) { if (status) status.textContent = "Карта временно недоступна. Введите адрес вручную."; }
}

if (!draft?.items?.length) { error("Корзина пуста. Вернитесь в магазин и добавьте товар."); document.querySelector('[data-checkout-view="form"]')?.setAttribute("hidden", ""); }
if (fulfillmentMethod === "pickup") { document.querySelector("[data-delivery-address]")?.setAttribute("hidden", ""); document.querySelector('[name="address"]')?.removeAttribute("required"); document.querySelector('[data-pay-button]')?.replaceChildren(document.createTextNode("Подтвердить заказ "), Object.assign(document.createElement("span"), { textContent: "→" })); }
setupDeliveryMap();
if (new URLSearchParams(location.search).get("payment") === "success") { show("result"); progress(3); localStorage.removeItem("otv-checkout-draft-v1"); }
if (new URLSearchParams(location.search).get("payment") === "failed") { show("result"); progress(3); document.querySelector("[data-result-icon]").textContent = "×"; document.querySelector("[data-result-kicker]").textContent = "Оплата не прошла"; document.querySelector("[data-result-title]").textContent = "Попробуйте ещё раз."; document.querySelector("[data-result-copy]").textContent = "Т‑Банк не подтвердил платёж. Проверьте данные карты или выберите другой способ оплаты."; }
document.querySelector("[data-delivery-details]")?.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.currentTarget));
  const validationErrors = validateCustomer(data);
  if (validationErrors.length) { error(validationErrors.join(" ")); return; }
  localStorage.setItem("otv-checkout-customer-v1", JSON.stringify(data));
  document.querySelector("[data-review-name]").textContent = data.name;
  document.querySelector("[data-review-email]").textContent = data.email;
  document.querySelector("[data-review-address]").textContent = fulfillmentMethod === "pickup" ? "Самовывоз" : data.address;
  document.querySelector("[data-review-total]").textContent = `${Number(draft.total || 0).toLocaleString("ru-RU")} ₽`;
  show("review"); progress(2); error("");
});
document.querySelector("[data-back-button]")?.addEventListener("click", () => { show("form"); progress(1); });
document.querySelector("[data-pay-button]")?.addEventListener("click", async (event) => {
  const button = event.currentTarget; const customer = JSON.parse(localStorage.getItem("otv-checkout-customer-v1") || "{}");
  button.disabled = true; button.querySelector("span").textContent = "…"; error("");
  try {
    const orderResponse = await fetch("/api/orders", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ customer, items:draft.items, total:draft.total, fulfillmentMethod, paymentStatus: fulfillmentMethod === "pickup" ? "not_required" : "pending_payment" }) });
    const order = await orderResponse.json(); if (!orderResponse.ok) throw new Error(order.error || "Не удалось создать заказ.");
    if (fulfillmentMethod === "pickup") { show("result"); progress(3); document.querySelector("[data-result-kicker]").textContent = "Заказ создан"; document.querySelector("[data-result-title]").textContent = "Мы подготовим его к выдаче."; document.querySelector("[data-result-copy]").textContent = "Подтверждение отправлено на вашу почту."; localStorage.removeItem("otv-checkout-draft-v1"); return; }
    const paymentResponse = await fetch("/api/tbank-init", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ ...draft, ...customer, customer, orderId:order.orderId }) });
    const payment = await paymentResponse.json(); if (!paymentResponse.ok || !payment.paymentUrl) throw new Error(payment.error || "Не удалось открыть оплату Т‑Банка.");
    window.location.href = payment.paymentUrl;
  } catch (requestError) { error(requestError.message || "Не удалось открыть оплату. Попробуйте ещё раз."); button.disabled = false; button.querySelector("span").textContent = "→"; }
});
