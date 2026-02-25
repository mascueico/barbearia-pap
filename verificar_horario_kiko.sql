-- Script para verificar e adicionar horário do Kiko Costa (id_funcionario = 1)
-- Executar no SQL Server Management Studio (SSMS)

-- Verificar se o Kiko Costa existe na tabela Funcionarios
SELECT id_funcionario, nome_completo, especialidade, email, telefone
FROM Funcionarios
WHERE nome_completo LIKE '%Kiko%' OR nome_completo LIKE '%Costa%';

-- Verificar se o Kiko Costa tem horário na tabela Horario
SELECT 
  f.nome_completo,
  h.dia_semana,
  h.hora_inicio,
  h.hora_fim
FROM Funcionarios f
LEFT JOIN Horario h ON f.id_funcionario = h.id_funcionario
WHERE f.nome_completo LIKE '%Kiko%' OR f.nome_completo LIKE '%Costa%';

-- Se não houver horário para o Kiko, adicionar o seguinte (id_funcionario = 1)
-- Dia_semana: 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sáb, 7=Dom
IF NOT EXISTS (SELECT 1 FROM Horario WHERE id_funcionario = 1)
BEGIN
  INSERT INTO Horario (id_funcionario, dia_semana, hora_inicio, hora_fim)
  VALUES 
    (1, 1, '10:00', '19:30'), -- Segunda-feira
    (1, 2, '10:00', '19:30'), -- Terça-feira
    (1, 3, '10:00', '19:30'), -- Quarta-feira
    (1, 4, '10:00', '19:30'), -- Quinta-feira
    (1, 5, '10:00', '20:00'), -- Sexta-feira
    (1, 6, '09:00', '18:00'); -- Sábado

  PRINT '✅ Horário do Kiko Costa adicionado com sucesso!';
END
ELSE
BEGIN
  PRINT 'ℹ️ O Kiko Costa já tem horário na base de dados';
END

-- Verificar novamente o horário completo
SELECT 
  f.id_funcionario,
  f.nome_completo,
  f.especialidade,
  h.dia_semana,
  h.hora_inicio,
  h.hora_fim
FROM Funcionarios f
LEFT JOIN Horario h ON f.id_funcionario = h.id_funcionario
ORDER BY f.id_funcionario, h.dia_semana;
