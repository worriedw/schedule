@echo off
REM Abre Chrome en la URL donde corre tu aplicación (ej. http://localhost:3000)
start chrome http://127.0.0.1:5173/
REM Cambia al directorio donde está tu proyecto de React y Express
cd C:\Users\carlos\Documents\NET\schedule

REM Ejecuta el script NPM que inicia ambos servicios
npm run start


REM Pausa para que la ventana no se cierre automáticamente al terminar
pause
