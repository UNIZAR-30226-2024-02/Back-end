#!/bin/bash

# Usage: ./deployment.sh <IP> <PUERTO>
#         IP: IP del servidor donde se desplegará la aplicación
#         PUERTO: Puerto donde estará a la escucha el front end web

# Dependencias necesarias: 
# 	- git 
#	- docker 

IP=$1
PUERTO=$2

if [ $# -ne 2 ]; then
    echo "Usage: ./deployment.sh [param1] [param2]"
    echo "  param1: IP del servidor donde se desplegará la aplicación"
    echo "  param2: Puerto donde estará a la escucha el front end web"
    exit 1
fi

# pongo en marcha el entorno de directorios
if [ -d "deploy" ]; then
    cd deploy
else
    mkdir deploy
    cd deploy
fi

if [ -d "Back-end" ]; then
    rm -r "Back-end"
fi

if [ -d "Front-end-web" ]; then
    rm -r "Front-end-web"
fi

# clono los repositorios
git clone https://github.com/UNIZAR-30226-2024-02/Back-end 
git clone https://github.com/UNIZAR-30226-2024-02/Front-end-web 

########################################################
##### CÓDIGO DE PRODUCCIÓN, DEBERÁ SER ELIMINADO ##### #
cd Back-end                                            #
git fetch origin                                       #
git checkout -b logicaPartida origin/logicaPartida     #
cd ..                                                  #                                   
cd Front-end-web                                       #
git fetch origin                                       #
git checkout -b 31-mapa origin/31-mapa                 #
cd ..                                                  #
##### FIN CÓDIGO DE PRODUCCIÓN #####                   #
########################################################

# cambio las direcciones IP de los archivos de configuración
cd Front-end-web/src/environment
sed -i "s/localhost/$IP/g" environment.ts
cat environment.ts
cd ../../..

# construyo las imágenes de docker
cd Back-end
docker build -t back-end .
cd ..
cd Front-end-web
docker build -t front-end-web .
cd ..

# elimino los contenedores antiguos, si existen
docker stop back-end
docker stop front-end-web
docker rm back-end
docker rm front-end-web

# pongo en marcha los contenedores
docker run -d --name back-end -p 4000:4000 back-end
docker run -d --name front-end-web -p $PUERTO:4200 front-end-web
