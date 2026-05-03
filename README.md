# QHay Web - Sistema de Gestión de Menú Digital

Este es el frontend de la plataforma **QHay**, un ecosistema diseñado para transformar la experiencia en restaurantes mediante menús digitales interactivos, gestión de pedidos en tiempo real y administración inteligente del local.

## 🌟 Características Principales

### Para Clientes (Menú Público)
- **Menú Categorizado**: Navegación fluida entre categorías (Entradas, Platos Fuertes, Bebidas, Postres).
- **Carrito de Compras**: Gestión intuitiva de pedidos con personalización de cantidades.
- **Historial de Pedidos**: Seguimiento en tiempo real del estado de la orden (Pendiente, Preparando, Listo, Entregado).
- **Solicitud de Pago**: Botón directo para avisar al personal cuando el cliente está listo para pagar.

### Para Restaurantes (Dashboard Administrativo)
- **Monitor de Pedidos en Tiempo Real**: Panel con notificaciones visuales y auditivas.
- **Alertas de Cobro**: Animaciones de pulso y notificaciones llamativas cuando un cliente solicita la cuenta.
- **Gestión de Carta**: CRUD completo de platos, categorías y disponibilidad.
- **Administración de Staff**: Registro y control de roles de meseros y administradores.
- **Gestión de QRs**: Generación individual o masiva de códigos QR por mesa con descarga directa.
- **Horarios de Atención**: Configuración flexible de apertura y cierre por día de la semana.

## 🚀 Tecnologías Utilizadas

- **React 18**: Arquitectura basada en componentes y hooks personalizados.
- **Vite**: Entorno de desarrollo y construcción de alto rendimiento.
- **Framer Motion**: Micro-interacciones y transiciones fluidas.
- **Lucide React**: Iconografía moderna y consistente.
- **CSS Vanilla (Glassmorphism)**: Interfaz premium basada en transparencias y desenfoques.
- **Clean Architecture**: Separación clara entre capas de dominio, casos de uso y presentación.

## 🛠️ Cómo Iniciar el Proyecto Localmente

Sigue estos pasos para levantar la web en tu entorno de desarrollo:

### 1. Clonar el repositorio
```bash
git clone <url-del-repositorio>
cd qhay-web
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Crea un archivo `.env` en la raíz con:
```env
VITE_API_URL=http://localhost:8080
```

### 4. Levantar el servidor
```bash
npm run dev
```
La aplicación estará disponible en: **[http://localhost:5173](http://localhost:5173)**

## 📂 Estructura del Proyecto

- `src/core`: Lógica de negocio (Entidades, Casos de Uso y Definición de Repositorios).
- `src/data`: Implementación de Repositorios, Mapeadores y Cliente HTTP.
- `src/presentation`: Componentes de UI, Páginas, Hooks y Estilos.

---
Desarrollado con ❤️ para **QHay**.
