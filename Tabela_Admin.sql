CREATE TABLE Administradores (
    id_admin INT IDENTITY(1,1) PRIMARY KEY,
    nome NVARCHAR(100) NOT NULL,
    email NVARCHAR(100) NOT NULL UNIQUE,
    palavra_passe NVARCHAR(255) NOT NULL,
    data_criacao DATETIME DEFAULT GETDATE()
);

INSERT INTO Administradores (nome, email, palavra_passe)
VALUES ('Admin', 'admin@barbearia.pt', '1234');
