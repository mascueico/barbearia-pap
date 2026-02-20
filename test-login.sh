#!/bin/bash

echo "Testando registo de utilizador..."
curl -X POST -H "Content-Type: application/json" -d '{"nome":"Teste User","email":"teste@exemplo.com","telefone":"919999999","senha":"teste123"}' http://localhost:3000/register

echo -e "\n\nTestando login com o utilizador recém-criado..."
curl -X POST -H "Content-Type: application/json" -d '{"email":"teste@exemplo.com","senha":"teste123"}' http://localhost:3000/cliente/login

echo -e "\n\nTestando login com o utilizador João Silva..."
curl -X POST -H "Content-Type: application/json" -d '{"email":"joao.silva@email.com","senha":"senha123"}' http://localhost:3000/cliente/login
