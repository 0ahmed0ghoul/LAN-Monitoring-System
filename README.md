# 🌐 LAN Monitoring System | SONATRACH Internship Project

A cross-platform **LAN Monitoring Web Application** developed during an internship at **DCRD - SONATRACH**, aiming to **display installed software and system information from all connected devices** on a local network. The system is designed to help IT administrators **supervise digital assets** and optimize equipment management in real-time.

---

## 🧭 Project Overview

This system allows administrators to:

- 🔎 Detect devices on the LAN
- 💻 View installed software, OS details, hardware specs (CPU, RAM)
- 📡 Monitor connected machines live via an intuitive dashboard
- 📁 Maintain a centralized log of device status and software inventory

---

## 🛠️ Technologies Used

| Layer           | Technologies                                      |
|----------------|----------------------------------------------------|
| **Frontend**    | React, Vite, HTML5, CSS3                          |
| **Backend**     | Node.js, Express.js, REST API                    |
| **Agent Script**| Python (using `psutil`, `platform`, `subprocess`) |
| **Testing**     | Oracle VirtualBox (Linux & Windows simulation)    |
| **Deployment**  | Windows Service, HTTP communication               |

---

## 🧩 System Architecture

```text
+------------------+        JSON via HTTP         +----------------+
|  Python Agent    |  ───────────────────────▶   |     Backend    |
|  (on each device)|                             |  (Node.js API) |
+------------------+                             +--------┬-------+
                                                          │
                                         fetch() requests ▼
                                                     +-------------+
                                                     |  Frontend   |
                                                     |   (React)   |
                                                     +-------------+
