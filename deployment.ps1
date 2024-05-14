# Usage: ./deployment.ps1 <IP> <PUERTO>
#         IP: IP del servidor donde se desplegará la aplicación
#         PUERTO: Puerto donde estará a la escucha el front end web

# Dependencias necesarias: 
# 	- git 
#	- docker 

param(
    [Parameter(Mandatory=$true)][string]$IP,
    [Parameter(Mandatory=$true)][string]$PUERTO
)

# pongo en marcha el entorno de directorios
if (Test-Path -Path .\deploy) {
    Set-Location -Path .\deploy
} else {
    New-Item -ItemType Directory -Path .\deploy
    Set-Location -Path .\deploy
}

if (Test-Path -Path .\Back-end) {
    Remove-Item -Recurse -Force -Path .\Back-end
}

if (Test-Path -Path .\Front-end-web) {
    Remove-Item -Recurse -Force -Path .\Front-end-web
}

# clono los repositorios
git clone https://github.com/UNIZAR-30226-2024-02/Back-end 
git clone https://github.com/UNIZAR-30226-2024-02/Front-end-web 

########################################################
##### CÓDIGO DE PRODUCCIÓN, DEBERÁ SER ELIMINADO ##### #
#Set-Location -Path .\Back-end
#git fetch origin
#git checkout -b logicaPartida origin/logicaPartida
#Set-Location -Path ..
#Set-Location -Path .\Front-end-web
#git fetch origin
#git checkout -b 31-mapa origin/31-mapa
#Set-Location -Path ..
##### FIN CÓDIGO DE PRODUCCIÓN #####                   #
########################################################

# cambio las direcciones IP de los archivos de configuración
Set-Location -Path .\Front-end-web\src\environment
(Get-Content -Path .\environment.ts) -replace 'localhost', $IP | Set-Content -Path .\environment.ts
Get-Content -Path .\environment.ts
Set-Location -Path ..\..\..

# construyo las imágenes de docker
Set-Location -Path .\Back-end
docker build -t back-end .
Set-Location -Path ..
Set-Location -Path .\Front-end-web
docker build -t front-end-web .
Set-Location -Path ..

# elimino los contenedores antiguos, si existen
docker stop back-end
docker stop front-end-web
docker rm back-end
docker rm front-end-web

# pongo en marcha los contenedores
docker run -d --name back-end -p 4000:4000 back-end
docker run -d --name front-end-web -p $PUERTO:4200 front-end-web
