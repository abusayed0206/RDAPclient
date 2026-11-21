# 🌐 RDAPclient

**RDAPclient** is a fast domain, IP and ASN lookup service powered by **Next.js** and **RDAP**. It features a responsive web UI and a clean JSON API for retrieving registration data in real time.

## ✨ Features

- **🌍 Web Interface:** Perform WHOIS lookups directly from a clean and modern browser interface.
- **⚡ Fast API:** Programmatic access to RDAP data using a REST-style endpoint.
- **📄 Rich JSON Output:** Includes registrar, expiration/registration dates, DNSSEC, EPP status (with official links), nameservers, and RDAP server.
- **🔐 CORS Enabled:** Easily consumable by frontend apps.
- **📘 ICANN EPP Labels:** Domain status codes are linked to ICANN’s official registry.
- **🌐 Standards-Based:** Built on top of the RDAP protocol defined by the IETF.

## 🆚 RDAP vs WHOIS

| Feature                          | WHOIS                                   | RDAP                                                      |
| -------------------------------- | --------------------------------------- | --------------------------------------------------------- |
| **Standardized Format**          | ❌ Inconsistent across registries       | ✅ JSON format, standardized                              |
| **Secure Access (HTTPS)**        | ❌ Typically plain text over port 43    | ✅ Always delivered over HTTPS                            |
| **Internationalization Support** | ❌ No Unicode support                   | ✅ Full support for internationalized data                |
| **Access Control**               | ❌ No user-based access differentiation | ✅ Can provide tiered access (public vs. privileged data) |
| **Searchability**                | ❌ Limited or unavailable               | ✅ Supports entity/domain queries                         |
| **Extensibility**                | ❌ Very limited                         | ✅ Easily extensible with new fields and capabilities     |
| **Service Discovery**            | ❌ Manual or unclear                    | ✅ Built-in mechanisms for registry discovery             |
| **Machine Readable**             | ❌ Hard to parse                        | ✅ Easy to integrate into apps & services                 |

> 📝 **ICANN Announcement**
> _“As of 28 January 2025, the Registration Data Access Protocol (RDAP) will be the definitive source for delivering generic top-level domain name (gTLD) registration information in place of sunsetted WHOIS services. RDAP offers several advantages over WHOIS including support for internationalization, secure access to data, authoritative service discovery, and the ability to provide differentiated access to registration data. RDAP was developed by the Internet Engineering Task Force.”_

➡️ [Source – ICANN Announcement (27 Jan 2025)](https://www.icann.org/en/announcements/details/icann-update-launching-rdap-sunsetting-whois-27-01-2025-en)

## 📡 API Documentation

Query RDAP records programmatically. Interactive docs with live examples: [rdap.sayed.app/api](https://rdap.sayed.app/api). All endpoints are `GET`, CORS-enabled, and return `{ "error": "..." }` with a matching HTTP status (400 invalid input, 404 not found / no RDAP service, 502/504 upstream registry problem) on failure. Successful responses are edge-cached for an hour.

### 🔗 Endpoints

| Endpoint               | Looks up                                       |
| ---------------------- | ---------------------------------------------- |
| `/api/lookup/{domain}` | Domain registration (URLs/subdomains accepted) |
| `/api/ip/{address}`    | IPv4 / IPv6 network allocation                 |
| `/api/asn/{number}`    | Autonomous system (`15169` or `AS15169`)       |

Every response includes `rdapServer` and `rdapUrl`, the exact upstream query.

### ✅ Example Request

```
GET https://rdap.sayed.app/api/lookup/abusayed.dev
```

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
    {
      "label": "Client transfer prohibited",
      "url": "https://icann.org/epp#clienttransferprohibited"
    },
    {
      "label": "Renew period",
      "url": "https://icann.org/epp#renewperiod"
    }
  ],
  "nameservers": ["lara.ns.cloudflare.com", "tony.ns.cloudflare.com"],
  "rdapServer": "https://pubapi.registry.google/rdap/"
}
```

### 📘 Response Fields

| Field          | Type           | Description                                        |
| -------------- | -------------- | -------------------------------------------------- |
| `domainName`   | `string`       | The fully qualified domain name.                   |
| `registrar`    | `string`       | The domain registrar organization.                 |
| `dnssec`       | `string`       | DNSSEC status (e.g., "Signed", "Unsigned").        |
| `registeredOn` | `string (GMT)` | Domain registration date.                          |
| `expiresOn`    | `string (GMT)` | Domain expiration date.                            |
| `lastUpdated`  | `string (GMT)` | Timestamp of the last known WHOIS update.          |
| `statuses`     | `object[]`     | Array of EPP status objects (`label` + `url`).     |
| `nameservers`  | `string[]`     | Array of authoritative nameservers.                |
| `rdapServer`   | `string`       | The RDAP server used to retrieve this information. |

## 📚 Specifications & Protocols

### 🌍 ICANN & IETF

- 📜 [ICANN – What is RDAP?](https://www.icann.org/rdap)
- 📄 [ICANN RDAP Replacement Announcement (Jan 2025)](https://www.icann.org/en/announcements/details/icann-update-launching-rdap-sunsetting-whois-27-01-2025-en)
- 🧾 [EPP Status Code Definitions (ICANN)](https://www.icann.org/resources/pages/epp-status-codes-2014-06-16-en)
- 📚 [IETF RDAP Specs (RFC 7480–7484)](https://datatracker.ietf.org/doc/html/rfc7480)

### 🧪 Test Clients & Tools

- 🌐 [Client.RDAP.org (Official UI)](https://client.rdap.org/)
- 📦 [RDAP Client GitHub Repo](https://github.com/rdap-org/client.rdap.org)
- 🧪 [ICANN RDAP Deployment Statistics ](https://deployment.rdap.org/)
- 🛠️ [ICANN RDAP Server Implementation (Reference)](https://github.com/icann/icann-rdap)

## 🔗 Live Demo

Check it out: [https://rdap.sayed.app](https://rdap.sayed.app)

## 📄 License

This project is open-source and available under the [MIT License](LICENSE)
