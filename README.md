# 🌐 whois.sayed.page

**whois.sayed.page** is a simple and blazing-fast WHOIS lookup service built with **Next.js**. It provides an intuitive web interface and a clean, developer-friendly API for querying domain registration information.

---

## ✨ Features

* **🌍 Web Interface:** Perform WHOIS lookups directly on the website with a minimal and responsive UI.
* **⚡ Fast API:** Programmatically retrieve WHOIS data through a simple REST API.
* **📄 Rich Output:** Get key domain information including registrar, registration dates, status codes, nameservers, and DNSSEC status.
* **🔒 CORS Enabled:** Use the API from your frontend projects without configuration hassles.

---

## 📡 API Documentation

Query domain WHOIS records programmatically.

### 🔗 Endpoint

```
GET https://whois.sayed.page/api/[domain]
```

> Replace `[domain]` with any valid domain name (e.g. `example.com`, `openai.org`, etc.)

---

### ✅ Example Request

```
GET https://whois.sayed.page/api/abusayed.dev
```

---

### 📦 Example Response

```json
{
  "domainName": "abusayed.dev",
  "registrar": "CloudFlare, Inc.",
  "dnssec": "Signed",
  "registeredOn": "Sun, 19 Sep 2021 15:18:19 GMT",
  "expiresOn": "Sat, 19 Sep 2026 15:18:19 GMT",
  "lastUpdated": "Wed, 11 Jun 2025 10:02:34 GMT",
  "statuses": [
    "Client transfer prohibited",
    "Renew period"
  ],
  "nameservers": [
    "lara.ns.cloudflare.com",
    "tony.ns.cloudflare.com"
  ]
}
```

---

### 📘 Response Fields

| Field          | Type           | Description                                 |
| -------------- | -------------- | ------------------------------------------- |
| `domainName`   | `string`       | The fully qualified domain name.            |
| `registrar`    | `string`       | The domain registrar organization.          |
| `dnssec`       | `string`       | DNSSEC status (e.g., "Signed", "Unsigned"). |
| `registeredOn` | `string (GMT)` | Domain registration date.                   |
| `expiresOn`    | `string (GMT)` | Domain expiration date.                     |
| `lastUpdated`  | `string (GMT)` | Last WHOIS update timestamp.                |
| `statuses`     | `string[]`     | List of domain status codes.                |
| `nameservers`  | `string[]`     | Array of authoritative nameservers.         |

---


---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).

---

## 🔗 Live Demo

Check it out live: [https://whois.sayed.page](https://whois.sayed.page)

