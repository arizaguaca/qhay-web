# QHay Web - Ecosistema Gastronómico Digital

**QHay** es una plataforma integral diseñada para modernizar la operación de restaurantes. Este repositorio contiene el frontend de la aplicación, construido con una arquitectura sólida y una interfaz premium (Glassmorphism) para ofrecer la mejor experiencia tanto a clientes como a administradores.

---

## 🌟 Características Principales

### 📱 Experiencia del Cliente (Menú Digital)
- **Acceso por QR**: Menú interactivo vinculado automáticamente a la mesa del cliente.
- **Carrito de Compras Inteligente**: Gestión de pedidos con personalización de cantidades y notas especiales.
- **Seguimiento en Tiempo Real**: Visualización del estado de la orden (Pendiente, Preparando, Listo, Entregado).
- **Solicitud de Servicios**: Botones directos para solicitar la cuenta o asistencia del personal.

### 📊 Dashboard Administrativo (Módulos)
El panel de administración está dividido en módulos especializados para cada área del restaurante:

1.  **🍳 KDS (Kitchen Display System)**: Monitor de cocina con vista FIFO, cronómetros de preparación y alertas de retraso. Filtra automáticamente ítems que no requieren preparación.
2.  **💰 Gestión de Caja (Cashier)**: Control de cuentas por pagar, registro de pagos y cierre de pedidos. Incluye agrupamiento de órdenes por cliente/mesa.
3.  **🪑 Gestión de Mesas**: Mapa interactivo para visualizar el estado de ocupación y pedidos activos por mesa.
4.  **📝 Monitor de Pedidos**: Listado global de todas las órdenes del día con filtros por estado.
5.  **🍽️ Gestor de Carta**: CRUD completo de platos, categorías, modificadores y disponibilidad en tiempo real.
6.  **👥 Administración de Staff**: Control de acceso y roles para meseros, cocineros y administradores.
7.  **⚙️ Configuración del Local**: Gestión de horarios de atención, información del restaurante y generación masiva de códigos QR.

---

## 🏗️ Arquitectura del Proyecto

El proyecto implementa **Clean Architecture** para garantizar escalabilidad, testeabilidad y desacoplamiento de la lógica de negocio frente a la interfaz de usuario:

-   **`src/core` (Dominio)**: Contiene las entidades de negocio, definiciones de repositorios (interfaces) y los casos de uso principales. Es el corazón de la aplicación y no tiene dependencias externas.
-   **`src/data` (Infraestructura)**: Implementación de repositorios, mapeadores de datos para la API y configuración del cliente HTTP/WebSocket.
-   **`src/presentation` (UI)**: Capa de visualización que incluye:
    -   **Components**: Componentes reutilizables siguiendo un diseño consistente.
    -   **Pages**: Vistas principales de la aplicación.
    -   **Hooks**: Lógica de estado y sincronización (ej. `useOrders`, `useSocket`).
    -   **Context**: Proveedores de estado global como el contexto de autenticación y WebSockets.

---

## 🚀 Tecnologías Utilizadas

-   **React 18**: Biblioteca base para la construcción de interfaces.
-   **Vite**: Tooling de alto rendimiento para el desarrollo y bundling.
-   **Socket.io-client**: Comunicación bidireccional en tiempo real para actualizaciones instantáneas de pedidos.
-   **Framer Motion**: Motor de animaciones para transiciones fluidas y micro-interacciones premium.
-   **Lucide React**: Set de iconos modernos y consistentes.
-   **CSS Vanilla & Glassmorphism**: Sistema de diseño personalizado basado en transparencias, desenfoques y gradientes dinámicos.

---

## 🛠️ Configuración y Despliegue Local

### 1. Requisitos Previos
- Node.js (v18 o superior)
- npm o yarn

### 2. Instalación
```bash
git clone <url-del-repositorio>
cd qhay-web
npm install
```

### 3. Variables de Entorno
Crea un archivo `.env` en la raíz del proyecto:
```env
VITE_API_URL=http://localhost:8080
VITE_SOCKET_URL=http://localhost:8080
```

### 4. Ejecución
```bash
# Modo desarrollo
npm run dev

# Construcción para producción
npm run build
```

La aplicación estará disponible por defecto en [http://localhost:5173](http://localhost:5173).

---

Desarrollado con pasión para transformar la industria gastronómica. 🚀
**© 2024 QHay Team.**
