<div align="center">

# EleMotor DMS

**Backend empresarial del sistema EleMotor — API REST robusta, modular y escalable**

![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![TypeORM](https://img.shields.io/badge/TypeORM-FE0902?style=for-the-badge&logo=typeorm&logoColor=white)
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
| **TypeORM**    | —       | ORM y gestión de esquema/migraciones |
| **Node.js**    | LTS     | Entorno de ejecución                 |

---

## ✅ Requisitos Previos

Antes de iniciar, asegúrese de tener instalado en su entorno local:

- **Node.js** — Versión LTS recomendada ([nodejs.org](https://nodejs.org))
- **MySQL** — Servidor local o credenciales de servidor remoto
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

### 3. Configurar variables de entorno

```bash
# Crear el archivo de entorno
cp .env.example .env
```

> Edite `.env` con los valores correspondientes a su entorno. Consulte la sección de [Variables de Entorno](#-configuración-de-base-de-datos-y-variables-de-entorno).

---

## 🔑 Configuración de Base de Datos y Variables de Entorno

Crear el archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_contraseña
DB_NAME=db_elemotor
PORT=3001
```

| Variable      | Descripción                    | Valor por defecto |
| ------------- | ------------------------------ | ----------------- |
| `DB_HOST`     | Host del servidor MySQL        | `localhost`       |
| `DB_PORT`     | Puerto de MySQL                | `3306`            |
| `DB_USER`     | Usuario de la base de datos    | `root`            |
| `DB_PASSWORD` | Contraseña del usuario         | —                 |
| `DB_NAME`     | Nombre de la base de datos     | `db_elemotor`     |
| `PORT`        | Puerto de escucha del servidor | `3001`            |

---

## 🗃️ Migraciones

Asegúrese de que el servidor MySQL esté activo antes de iniciar la aplicación. El sistema utiliza **TypeORM** para la gestión del esquema de base de datos.

Para aplicar migraciones (si están configuradas):

```bash
npm run migration:run
```

> Si el entorno de desarrollo tiene activada la sincronización automática (`synchronize: true`), TypeORM reflejará los cambios de entidades directamente en la base de datos sin necesidad de ejecutar migraciones manualmente.

---

## 📂 Estructura Modular del Backend

```
elemotor_DMS/
 ├── src/
 │   ├── modules/     # Módulos de dominio (features)
 │   ├── controllers/ # Controladores REST
 │   ├── services/    # Lógica de negocio
 │   ├── entities/    # Entidades TypeORM
 │   └── main.ts      # Punto de entrada de la aplicación
 ├── test/            # Pruebas automatizadas (unitarias y e2e)
 ├── .env             # Variables de entorno (no versionar)
 ├── nest-cli.json
 └── tsconfig.json
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

El servidor estará disponible en: **[http://localhost:3001](http://localhost:3001)**

> La documentación de la API (Swagger) estará disponible en `http://localhost:3001/api` si está configurada en el proyecto.

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
