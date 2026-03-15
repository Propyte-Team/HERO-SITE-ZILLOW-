# Deploy en Hostinger

## Pre-requisitos
1. Hosting Hostinger con acceso SSH y Node.js (plan Business o Cloud)
2. Node.js 18+ habilitado en el panel
3. Dominio propyte.com apuntando a Hostinger

## Configuración de Mapbox (hacer ANTES del deploy)
1. Ve a https://account.mapbox.com/auth/signup/ y crea cuenta gratuita
2. En el dashboard, copia tu "Default public token"
3. Pega el token en .env.local como NEXT_PUBLIC_MAPBOX_TOKEN

## Build y deploy
1. Clona el repositorio en tu servidor Hostinger via SSH
2. Copia .env.local.example a .env.local y llena todas las variables
3. `npm install`
4. `npm run build`
5. El output standalone está en `.next/standalone/`
6. Copia la carpeta `.next/static` a `.next/standalone/.next/static`
7. Copia la carpeta `public` a `.next/standalone/public`
8. Ejecuta: `node .next/standalone/server.js`
9. Configura PM2 o el proceso manager de Hostinger para mantenerlo vivo
10. Configura reverse proxy (Nginx/Apache) para apuntar al puerto 3000

## Configuración de Analytics
1. GA4: Crea propiedad en analytics.google.com, copia el Measurement ID (G-XXXXX)
2. Hotjar: Crea cuenta en hotjar.com, copia el Site ID
3. Actualiza .env.local con ambos IDs

## Variables de entorno necesarias
- NEXT_PUBLIC_MAPBOX_TOKEN
- NEXT_PUBLIC_WHATSAPP_PHONE
- NEXT_PUBLIC_WEBHOOK_URL
- NEXT_PUBLIC_GA4_ID
- NEXT_PUBLIC_HOTJAR_ID
- NEXT_PUBLIC_SITE_URL
