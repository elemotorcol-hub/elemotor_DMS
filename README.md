<div align="center">

# EleMotor DMS

**Backend empresarial del sistema EleMotor — API REST robusta, modular y escalable**

![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![Estado](https://img.shields.io/badge/Estado-En%20Desarrollo-orange?style=for-the-badge)

</div>

---

## 📋 Descripción General

**EleMotor DMS** es la capa de backend del sistema EleMotor. Se encarga de la lógica de negocio, la persistencia de datos y la exposición de endpoints REST seguros. Su arquitectura modular basada en NestJS facilita el mantenimiento a largo plazo e iteraciones ágiles del equipo de desarrollo.

> 🔗 El backend provee la API consumida por el repositorio [`elemotor_Web`](../elemotor_Web) (Frontend).

---

## 🛠️ Tecnologías Utilizadas

| Tecnología     | Versión | Propósito                            |
| -------------- | ------- | ------------------------------------ |
| **NestJS**     | LTS     | Framework principal del servidor     |
| **TypeScript** | Strict  | Tipado estático extremo a extremo    |
| **MySQL**      | —       | Motor de base de datos relacional    |
| **Prisma**     | v6      | ORM de próxima generación            |
| **Node.js**    | LTS     | Entorno de ejecución                 |
| **Docker**     | —       | Contenedor nativo para base de datos |

---

## ✅ Requisitos Previos

Antes de iniciar, asegúrese de tener instalado en su entorno local:

- **Node.js** — Versión LTS recomendada ([nodejs.org](https://nodejs.org))
- **Docker** — Para levantar la base de datos MySQL local
- **Git** — Sistema de control de versiones ([git-scm.com](https://git-scm.com))
- **Nest CLI** _(Opcional, recomendado)_ — `npm i -g @nestjs/cli`

---

## 🚀 Instalación

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio-backend>
cd elemotor_DMS
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar entorno y Base de Datos

```bash
# Crear el archivo de entorno
cp .env.example .env

# Levantar contenedor de MySQL
docker compose up -d

# Generar cliente de Prisma
npx prisma generate
```

> Edite `.env` con los valores correspondientes si difieren del ejemplo. Consulte la sección de [Variables de Entorno](#-configuración-de-base-de-datos-y-variables-de-entorno).

---

## 🔑 Configuración de Base de Datos y Variables de Entorno

Crear el archivo `.env` en la raíz del proyecto con las siguientes variables básicas para inicializar:

```env
PORT=4000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3307
DB_USER=root
DB_PASSWORD=tu_contraseña
DB_NAME=db_elemotor

DATABASE_URL="mysql://root:tu_contraseña@localhost:3307/db_elemotor"
```

| Variable       | Descripción                           | Valor por defecto |
| -------------- | ------------------------------------- | ----------------- |
| `PORT`         | Puerto de escucha del servidor NestJS | `4000`            |
| `DB_PORT`      | Puerto expuesto por Docker para MySQL | `3307`            |
| `DATABASE_URL` | URL de conexión para Prisma ORM       | —                 |

---

## 🗃️ Base de Datos y Prisma

Asegúrese de que el contenedor Docker esté activo antes de iniciar la aplicación. El sistema utiliza **Prisma ORM** como herramienta de persistencia.

Para sincronizar o hacer push del esquema `schema.prisma` a la base de datos en desarrollo:

```bash
npx prisma db push
```

> También puedes usar `npx prisma studio` para abrir una interfaz gráfica en `localhost:5555` y explorar los datos de tu base de datos directamente.

---

## 📂 Estructura Modular del Backend

```
elemotor_DMS/
 ├── prisma/          # Schema de base de datos Prisma
 ├── src/
 │   ├── modules/     # Módulos de dominio (features)
 │   ├── config/      # Configuraciones de entorno
 │   ├── common/      # Filtros, decoradores e interceptores
 │   └── main.ts      # Punto de entrada de la aplicación
 ├── test/            # Pruebas automatizadas (unitarias y e2e)
 ├── docker-compose.yml # Definición de contenedores locales
 ├── .env             # Variables de entorno (no versionar)
 └── package.json
```

---

## 📜 Scripts Disponibles

| Comando             | Descripción                                          |
| ------------------- | ---------------------------------------------------- |
| `npm run start:dev` | Inicia el servidor en modo desarrollo con watch mode |
| `npm run build`     | Compila TypeScript a JavaScript para producción      |
| `npm run start`     | Inicia el servidor en modo producción                |
| `npm run test`      | Ejecuta la suite de pruebas automatizadas            |
| `npm run test:e2e`  | Ejecuta las pruebas end-to-end                       |

---

## ▶️ Cómo Ejecutar el Servidor

```bash
npm run start:dev
```

El servidor estará disponible en: **[http://localhost:4000/api](http://localhost:4000/api)**

> **Swagger / Docs API:** La documentación autogenerada estará disponible en **[http://localhost:4000/api/docs](http://localhost:4000/api/docs)**
> **Health Check:** Puedes verificar la salud del servicio ingresando a **[http://localhost:4000/api/health](http://localhost:4000/api/health)**

---

## 👥 Equipo de Desarrollo

| Rol                       | Nombre                  |
| ------------------------- | ----------------------- |
| 🧑‍💼 Líder Técnico          | Marly Tatiana Rangel    |
| 💻 Desarrollador Frontend | Juan Camilo Rodríguez   |
| ⚙️ Desarrollador Backend  | David Fernando Carrillo |
| 🎨 Modelador 3D           | Santiago Plata          |

---

<div align="center">

**EleMotor DMS** · En desarrollo · 2026

</div>
