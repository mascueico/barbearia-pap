-- Script para adicionar os novos barbeiros (Dydas e Renato) à base de dados
-- Executar no SQL Server Management Studio (SSMS)

-- 1. Adicionar Dydas à tabela Funcionarios
INSERT INTO Funcionarios (nome_completo, especialidade, email, telefone)
VALUES ('Dydas', 'Specialist Barber', 'dydas@barbeariaflokiko.pt', '911234567');

-- 2. Adicionar Renato à tabela Funcionarios
INSERT INTO Funcionarios (nome_completo, especialidade, email, telefone)
VALUES ('Renato Almeida', 'Rookie Barber', 'renato@barbeariaflokiko.pt', '919876543');

-- 3. Horário de Dydas (id_funcionario = 2)
-- Dia_semana: 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sáb, 7=Dom
INSERT INTO Horario (id_funcionario, dia_semana, hora_inicio, hora_fim)
VALUES 
  (2, 1, '09:00', '18:00'), -- Segunda-feira
  (2, 2, '09:00', '18:00'), -- Terça-feira
  (2, 3, '10:00', '19:00'), -- Quarta-feira
  (2, 4, '09:00', '18:00'), -- Quinta-feira
  (2, 5, '09:00', '20:00'), -- Sexta-feira
  (2, 6, '09:00', '17:00'); -- Sábado

-- 4. Horário de Renato (id_funcionario = 3)
INSERT INTO Horario (id_funcionario, dia_semana, hora_inicio, hora_fim)
VALUES 
  (3, 1, '10:00', '19:00'), -- Segunda-feira
  (3, 2, '10:00', '19:00'), -- Terça-feira
  (3, 4, '10:00', '19:00'), -- Quinta-feira
  (3, 5, '10:00', '20:00'), -- Sexta-feira
  (3, 6, '09:00', '18:00'); -- Sábado

-- 5. Verificar se os registros foram inseridos com sucesso
SELECT 
  f.id_funcionario,
  f.nome_completo,
  f.especialidade,
  f.email,
  f.telefone,
  h.dia_semana,
  h.hora_inicio,
  h.hora_fim
FROM Funcionarios f
LEFT JOIN Horario h ON f.id_funcionario = h.id_funcionario
WHERE f.nome_completo IN ('Dydas', 'Renato Almeida')
ORDER BY f.id_funcionario, h.dia_semana;

PRINT '✅ Barbeiros Dydas e Renato adicionados com sucesso!';
PRINT '📅 Horários individuais configurados para cada barbeiro';
